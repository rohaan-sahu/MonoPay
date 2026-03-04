import { burn, create, mplCore, safeFetchAssetV1, updatePlugin } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { getMetaplexConfig, resolveWalletAddress } from "@mpay/services/sandbox/env";
import {
  CreateIdCardInput,
  IdCardAdapter,
  IdCardRecord,
  ImmutableCardFields,
  ProfilePlugin,
  UpdatePluginFieldInput
} from "@mpay/services/sandbox/types";

const IMMUTABLE_FIELDS: (keyof ImmutableCardFields)[] = ["cardId", "owner", "createdAt", "network"];
const PROFILE_FIELDS: (keyof ProfilePlugin)[] = ["displayName", "avatarUrl", "paymentPointer", "bio"];
const ACCOUNT_POLL_MAX_ATTEMPTS = 45;
const ACCOUNT_POLL_DELAY_MS = 1200;
const QUICK_FETCH_MAX_ATTEMPTS = 2;
const QUICK_FETCH_DELAY_MS = 150;

type AssetAttribute = {
  key?: string;
  value?: string;
};

type AssetAttributesPlugin = {
  attributeList?: AssetAttribute[];
};

type AssetLike = {
  publicKey?: unknown;
  owner?: unknown;
  attributes?: AssetAttributesPlugin;
};

function inferNetwork(rpcUrl: string): IdCardRecord["network"] {
  if (rpcUrl.includes("mainnet")) {
    return "solana-mainnet";
  }

  if (rpcUrl.includes("testnet")) {
    return "solana-testnet";
  }

  return "solana-devnet";
}

function assertCreateInput(input: CreateIdCardInput) {
  if (!input.owner.trim()) {
    throw new Error("Owner is required.");
  }

  if (!input.displayName.trim()) {
    throw new Error("Display name is required.");
  }

  if (!input.paymentPointer.trim()) {
    throw new Error("Payment pointer is required.");
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isAssetNotFoundError(error: unknown) {
  return getErrorMessage(error).includes("AssetV1] was not found");
}

function toAttributesList(card: IdCardRecord) {
  return [
    { key: "displayName", value: card.plugins.profile.displayName },
    { key: "avatarUrl", value: card.plugins.profile.avatarUrl },
    { key: "paymentPointer", value: card.plugins.profile.paymentPointer },
    { key: "bio", value: card.plugins.profile.bio },
    { key: "immutable.cardId", value: card.cardId },
    { key: "immutable.owner", value: card.owner },
    { key: "immutable.createdAt", value: card.createdAt }
  ];
}

function toStringValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof (value as { toString?: () => string }).toString === "function") {
    return (value as { toString: () => string }).toString();
  }

  return "";
}

function getAttributeValue(attributeList: AssetAttribute[], key: string, fallback: string) {
  const found = attributeList.find((attribute) => attribute.key === key);

  if (typeof found?.value === "string" && found.value.trim()) {
    return found.value.trim();
  }

  return fallback;
}

export class MetaplexIdCardAdapter implements IdCardAdapter {
  private config: ReturnType<typeof getMetaplexConfig> | null = null;
  private umi: ReturnType<typeof createUmi> | null = null;
  private cards = new Map<string, IdCardRecord>();

  private getClient() {
    if (this.config && this.umi) {
      return { config: this.config, umi: this.umi };
    }

    const config = getMetaplexConfig();
    const umi = createUmi(config.rpcUrl).use(mplCore());
    const signer = umi.eddsa.createKeypairFromSecretKey(config.signerSecretKey);
    umi.use(keypairIdentity(signer));

    this.config = config;
    this.umi = umi;

    return { config, umi };
  }

  private async waitForAssetAvailability(
    umi: ReturnType<typeof createUmi>,
    assetAddress: string,
    options?: { maxAttempts?: number; delayMs?: number }
  ) {
    const maxAttempts = options?.maxAttempts ?? ACCOUNT_POLL_MAX_ATTEMPTS;
    const delayMs = options?.delayMs ?? ACCOUNT_POLL_DELAY_MS;
    const assetPublicKey = publicKey(assetAddress);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const fetched = await safeFetchAssetV1(umi, assetPublicKey, { commitment: "confirmed" });

        if (fetched) {
          return fetched;
        }
      } catch (error) {
        if (!isAssetNotFoundError(error)) {
          throw error;
        }
      }

      await sleep(delayMs);
    }

    throw new Error(`Asset ${assetAddress} was not visible after ${maxAttempts} polling attempts.`);
  }

  private buildCardFromAsset(asset: AssetLike, fallback?: Partial<IdCardRecord>) {
    const { config } = this.getClient();
    const attributeList = Array.isArray(asset.attributes?.attributeList) ? asset.attributes.attributeList : [];
    const fetchedCardId = toStringValue(asset.publicKey);
    const fetchedOwner = toStringValue(asset.owner);
    const fallbackProfile = fallback?.plugins?.profile;

    const card: IdCardRecord = {
      cardId: getAttributeValue(attributeList, "immutable.cardId", fallback?.cardId || fetchedCardId),
      owner: getAttributeValue(attributeList, "immutable.owner", fallback?.owner || fetchedOwner),
      createdAt: getAttributeValue(attributeList, "immutable.createdAt", fallback?.createdAt || new Date().toISOString()),
      network: fallback?.network || inferNetwork(config.rpcUrl),
      status: fallback?.status || "active",
      deactivatedAt: fallback?.deactivatedAt,
      lastSyncAt: fallback?.lastSyncAt,
      lastTxSignature: fallback?.lastTxSignature,
      plugins: {
        profile: {
          displayName: getAttributeValue(attributeList, "displayName", fallbackProfile?.displayName || "MonoPay User"),
          avatarUrl: getAttributeValue(attributeList, "avatarUrl", fallbackProfile?.avatarUrl || ""),
          paymentPointer: getAttributeValue(attributeList, "paymentPointer", fallbackProfile?.paymentPointer || ""),
          bio: getAttributeValue(attributeList, "bio", fallbackProfile?.bio || ""),
        },
      },
    };

    return card;
  }

  private async waitForAssetDeletion(
    umi: ReturnType<typeof createUmi>,
    assetAddress: string,
    options?: { maxAttempts?: number; delayMs?: number }
  ) {
    const maxAttempts = options?.maxAttempts ?? ACCOUNT_POLL_MAX_ATTEMPTS;
    const delayMs = options?.delayMs ?? ACCOUNT_POLL_DELAY_MS;
    const assetPublicKey = publicKey(assetAddress);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const fetched = await safeFetchAssetV1(umi, assetPublicKey, { commitment: "confirmed" });

      if (!fetched) {
        return;
      }

      await sleep(delayMs);
    }

    throw new Error(`Asset ${assetAddress} still exists after burn polling attempts.`);
  }

  async createCard(input: CreateIdCardInput): Promise<IdCardRecord> {
    assertCreateInput(input);
    const { config, umi } = this.getClient();

    const ownerAddress = resolveWalletAddress(input.owner, {
      directory: config.handleDirectory,
      fallbackAddress: config.defaultOwnerPublicKey,
      label: "ID card owner"
    });
    const asset = generateSigner(umi);
    const createdAt = new Date().toISOString();

    const card: IdCardRecord = {
      cardId: String(asset.publicKey),
      owner: ownerAddress,
      createdAt,
      network: inferNetwork(config.rpcUrl),
      status: "active",
      plugins: {
        profile: {
          displayName: input.displayName.trim(),
          avatarUrl: input.avatarUrl.trim(),
          paymentPointer: input.paymentPointer.trim(),
          bio: input.bio.trim()
        }
      }
    };

    const sendResult = await create(umi, {
      name: `MonoPay ID • ${card.plugins.profile.displayName}`,
      uri: config.metadataUri,
      asset,
      owner: publicKey(card.owner),
      plugins: [
        {
          type: "Attributes",
          attributeList: toAttributesList(card)
        }
      ]
    }).sendAndConfirm(umi);
    const signature = sendResult?.signature ? String(sendResult.signature) : undefined;
    const syncedAt = new Date().toISOString();
    console.log("[identity-flow] metaplex:create:submitted", {
      cardId: card.cardId,
      owner: card.owner,
      signature,
    });
    const fetched = await this.waitForAssetAvailability(umi, card.cardId);
    const syncedCard = this.buildCardFromAsset(fetched as AssetLike, {
      ...card,
      lastSyncAt: syncedAt,
      lastTxSignature: signature,
    });
    console.log("[identity-flow] metaplex:create:confirmed", {
      cardId: syncedCard.cardId,
      signature: syncedCard.lastTxSignature,
      syncedAt: syncedCard.lastSyncAt,
    });

    this.cards.set(syncedCard.cardId, syncedCard);
    return syncedCard;
  }

  async updatePluginField(input: UpdatePluginFieldInput): Promise<IdCardRecord> {
    const { umi, config } = this.getClient();
    const cachedCard = this.cards.get(input.cardId);
    const fetchedBeforeUpdate = await this.waitForAssetAvailability(umi, input.cardId);
    const card = this.buildCardFromAsset(fetchedBeforeUpdate as AssetLike, {
      ...cachedCard,
      cardId: input.cardId,
      status: cachedCard?.status || "active",
      network: cachedCard?.network || inferNetwork(config.rpcUrl),
    });

    if (card.status !== "active") {
      throw new Error("ID card is deactivated. Updates are blocked.");
    }

    if (IMMUTABLE_FIELDS.includes(input.field as keyof ImmutableCardFields)) {
      throw new Error(`Field '${input.field}' is immutable and cannot be changed.`);
    }

    if (input.plugin !== "profile") {
      throw new Error("Unsupported plugin.");
    }

    if (!PROFILE_FIELDS.includes(input.field as keyof ProfilePlugin)) {
      throw new Error(`Unsupported plugin field: ${input.field}`);
    }

    const field = input.field as keyof ProfilePlugin;
    const updatedCard: IdCardRecord = {
      ...card,
      plugins: {
        ...card.plugins,
        profile: {
          ...card.plugins.profile,
          [field]: input.value.trim()
        }
      }
    };

    const updateResult = await updatePlugin(umi, {
      asset: publicKey(card.cardId),
      plugin: {
        type: "Attributes",
        attributeList: toAttributesList(updatedCard)
      }
    }).sendAndConfirm(umi);
    const signature = updateResult?.signature ? String(updateResult.signature) : undefined;
    const syncedAt = new Date().toISOString();
    console.log("[identity-flow] metaplex:update:submitted", {
      cardId: updatedCard.cardId,
      signature,
      field,
      syncedAt,
    });
    const fetchedAfterUpdate = await this.waitForAssetAvailability(umi, updatedCard.cardId);
    const syncedCard = this.buildCardFromAsset(fetchedAfterUpdate as AssetLike, {
      ...updatedCard,
      lastSyncAt: syncedAt,
      lastTxSignature: signature,
    });
    console.log("[identity-flow] metaplex:update:confirmed", {
      cardId: syncedCard.cardId,
      signature: syncedCard.lastTxSignature,
      syncedAt: syncedCard.lastSyncAt,
      field,
    });

    this.cards.set(syncedCard.cardId, syncedCard);
    return syncedCard;
  }

  async deactivateCard(input: { cardId: string; reason?: string }): Promise<IdCardRecord> {
    const { umi, config } = this.getClient();
    const cachedCard = this.cards.get(input.cardId);
    const fetchedBeforeBurn = await this.waitForAssetAvailability(umi, input.cardId);
    const existing = this.buildCardFromAsset(fetchedBeforeBurn as AssetLike, {
      ...cachedCard,
      cardId: input.cardId,
      status: cachedCard?.status || "active",
      network: cachedCard?.network || inferNetwork(config.rpcUrl),
    });

    if (existing.status === "deactivated") {
      return existing;
    }

    const burnResult = await burn(umi, { asset: fetchedBeforeBurn }).sendAndConfirm(umi);
    const signature = burnResult?.signature ? String(burnResult.signature) : undefined;
    const syncedAt = new Date().toISOString();
    console.log("[identity-flow] metaplex:burn:submitted", {
      cardId: existing.cardId,
      signature,
    });
    await this.waitForAssetDeletion(umi, existing.cardId);

    const updatedCard: IdCardRecord = {
      ...existing,
      status: "deactivated",
      deactivatedAt: syncedAt,
      lastSyncAt: syncedAt,
      lastTxSignature: signature,
    };

    this.cards.set(updatedCard.cardId, updatedCard);
    return updatedCard;
  }

  async getCard(cardId: string): Promise<IdCardRecord | null> {
    const cachedCard = this.cards.get(cardId);

    if (cachedCard) {
      return cachedCard;
    }

    const { umi, config } = this.getClient();
    const fetched = await this.waitForAssetAvailability(umi, cardId, {
      maxAttempts: QUICK_FETCH_MAX_ATTEMPTS,
      delayMs: QUICK_FETCH_DELAY_MS,
    }).catch(() => null);

    if (!fetched) {
      return null;
    }

    const card = this.buildCardFromAsset(fetched as AssetLike, {
      cardId,
      status: "active",
      network: inferNetwork(config.rpcUrl),
    });

    this.cards.set(card.cardId, card);
    return card;
  }
}
