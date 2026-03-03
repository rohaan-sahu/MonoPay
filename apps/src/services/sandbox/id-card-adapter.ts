import { burn, create, fetchAssetV1, mplCore, safeFetchAssetV1, updatePlugin } from "@metaplex-foundation/mpl-core";
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

    await create(umi, {
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
    await fetchAssetV1(umi, publicKey(card.cardId));

    this.cards.set(card.cardId, card);
    return card;
  }

  async updatePluginField(input: UpdatePluginFieldInput): Promise<IdCardRecord> {
    const { umi } = this.getClient();
    const card = this.cards.get(input.cardId);

    if (!card) {
      throw new Error("ID card not found in adapter cache. Create one in this session first.");
    }

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

    await updatePlugin(umi, {
      asset: publicKey(card.cardId),
      plugin: {
        type: "Attributes",
        attributeList: toAttributesList(updatedCard)
      }
    }).sendAndConfirm(umi);
    await fetchAssetV1(umi, publicKey(updatedCard.cardId));

    this.cards.set(updatedCard.cardId, updatedCard);
    return updatedCard;
  }

  async deactivateCard(input: { cardId: string; reason?: string }): Promise<IdCardRecord> {
    const { umi } = this.getClient();
    const existing = this.cards.get(input.cardId);

    if (!existing) {
      throw new Error("ID card not found in adapter cache. Create one in this session first.");
    }

    if (existing.status === "deactivated") {
      return existing;
    }

    const assetAccount = await fetchAssetV1(umi, publicKey(existing.cardId));
    await burn(umi, { asset: assetAccount }).sendAndConfirm(umi);
    const afterBurn = await safeFetchAssetV1(umi, publicKey(existing.cardId));

    if (afterBurn) {
      throw new Error("On-chain burn verification failed: asset still exists.");
    }

    const updatedCard: IdCardRecord = {
      ...existing,
      status: "deactivated",
      deactivatedAt: new Date().toISOString()
    };

    this.cards.set(updatedCard.cardId, updatedCard);
    return updatedCard;
  }

  async getCard(cardId: string): Promise<IdCardRecord | null> {
    return this.cards.get(cardId) ?? null;
  }
}
