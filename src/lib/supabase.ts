import { createClient,processLock } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_PREFIX = "MPAY_SUPABASE_";
const SECURE_STORE_CHUNK_SIZE = 1800;
const memoryStorage = new Map<string, string>();

const secureStoreAvailabilityPromise = SecureStore.isAvailableAsync().catch(() => false);
console.log("[wallet-connect-trace] supabase:init", {
  hasSupabaseUrl: Boolean(supabaseUrl),
  hasSupabaseAnonKey: Boolean(supabaseAnonKey),
});
void secureStoreAvailabilityPromise.then((available) => {
  console.log("[wallet-connect-trace] supabase:secure-store", { available });
});

function scopedStorageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

function chunkCountKey(scopedKey: string) {
  return `${scopedKey}__chunk_count`;
}

function chunkValueKey(scopedKey: string, index: number) {
  return `${scopedKey}__chunk_${index}`;
}

async function getSecureStoreChunkCount(scopedKey: string) {
  const rawChunkCount = await SecureStore.getItemAsync(chunkCountKey(scopedKey));

  if (!rawChunkCount) {
    return 0;
  }

  const parsed = Number.parseInt(rawChunkCount, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function clearSecureStoreValue(scopedKey: string) {
  const chunkCount = await getSecureStoreChunkCount(scopedKey);

  if (chunkCount > 0) {
    for (let index = 0; index < chunkCount; index += 1) {
      await SecureStore.deleteItemAsync(chunkValueKey(scopedKey, index));
    }
  }

  await SecureStore.deleteItemAsync(chunkCountKey(scopedKey));
  await SecureStore.deleteItemAsync(scopedKey);
}

async function readSecureStoreValue(scopedKey: string) {
  const chunkCount = await getSecureStoreChunkCount(scopedKey);

  if (chunkCount > 0) {
    const chunks: string[] = [];

    for (let index = 0; index < chunkCount; index += 1) {
      const chunk = await SecureStore.getItemAsync(chunkValueKey(scopedKey, index));

      if (chunk === null) {
        console.warn("[supabase-storage] Missing chunk while reading secure value.", { scopedKey, index, chunkCount });
        return null;
      }

      chunks.push(chunk);
    }

    return chunks.join("");
  }

  return SecureStore.getItemAsync(scopedKey);
}

async function writeSecureStoreValue(scopedKey: string, value: string) {
  await clearSecureStoreValue(scopedKey);

  if (value.length <= SECURE_STORE_CHUNK_SIZE) {
    await SecureStore.setItemAsync(scopedKey, value);
    return;
  }

  const chunks: string[] = [];

  for (let start = 0; start < value.length; start += SECURE_STORE_CHUNK_SIZE) {
    chunks.push(value.slice(start, start + SECURE_STORE_CHUNK_SIZE));
  }

  for (let index = 0; index < chunks.length; index += 1) {
    await SecureStore.setItemAsync(chunkValueKey(scopedKey, index), chunks[index]);
  }

  await SecureStore.setItemAsync(chunkCountKey(scopedKey), String(chunks.length));
}

const supabaseStorage = {
  async getItem(key: string) {
    const scopedKey = scopedStorageKey(key);
    const secureStoreAvailable = await secureStoreAvailabilityPromise;

    if (secureStoreAvailable) {
      try {
        const value = await readSecureStoreValue(scopedKey);
        if (value !== null) {
          return value;
        }
      } catch (error) {
        console.warn("[supabase-storage] SecureStore getItem failed, using memory fallback.", error);
      }
    }

    return memoryStorage.get(scopedKey) ?? null;
  },
  async setItem(key: string, value: string) {
    const scopedKey = scopedStorageKey(key);
    const secureStoreAvailable = await secureStoreAvailabilityPromise;

    if (secureStoreAvailable) {
      try {
        await writeSecureStoreValue(scopedKey, value);
        memoryStorage.delete(scopedKey);
        return;
      } catch (error) {
        console.warn("[supabase-storage] SecureStore setItem failed, using memory fallback.", error);
      }
    }

    memoryStorage.set(scopedKey, value);
  },
  async removeItem(key: string) {
    const scopedKey = scopedStorageKey(key);
    const secureStoreAvailable = await secureStoreAvailabilityPromise;

    if (secureStoreAvailable) {
      try {
        await clearSecureStoreValue(scopedKey);
      } catch (error) {
        console.warn("[supabase-storage] SecureStore removeItem failed, using memory fallback.", error);
      }
    }

    memoryStorage.delete(scopedKey);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
