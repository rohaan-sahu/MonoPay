import { create } from "zustand";
import { persist, createJSONStorage} from 'zustand/middleware';
import { PublicKey } from "@solana/web3.js";

import { asyncStorageAdapter } from "@/lib/storageAsync";
import { mmkvStorage } from "@/lib/storageMMKV";

// Define the shape of your state
interface WalletState {
  // Data
  favorites: string[];          // saved wallet addresses
  searchHistory: string[];      // recently searched addresses
  isDevnet: boolean;            // devnet vs mainnet toggle
  publicKey: PublicKey | null;  // Wallet address
  connecting: boolean;
  sending: boolean;

  // Actions
  //GET
  isFavorite: (address: string) => boolean;
  
  //SET
  addFavorite: (address: string) => void;
  removeFavorite: (address: string) => void;
  addToHistory: (address: string) => void;
  clearHistory: () => void;
  toggleNetwork: () => void;
  setPublicKey: (address: PublicKey | null) => void;
  setConnecting: (val:boolean) => void;
  setSending: (val: boolean) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
    // Initial state
    favorites: [],
    searchHistory: [],
    isDevnet: false,
    publicKey: null,
    connecting: false,
    sending: false,

    // Actions
    //GET
    isFavorite: (address) => get().favorites.includes(address),

    //SET
    addFavorite: (address) =>
      set((state) => ({
        favorites: state.favorites.includes(address)
          ? state.favorites // already exists, don't duplicate
          : [address, ...state.favorites],
      })),

    removeFavorite: (address) =>
      set((state) => ({
        favorites: state.favorites.filter((a) => a !== address),
      })),

    addToHistory: (address) =>
      set((state) => ({
        searchHistory: [
          address,
          // Remove duplicates — put the latest search first
          ...state.searchHistory.filter((a) => a !== address),
        ].slice(0, 20), // Keep only last 20
      })),

    clearHistory: () => set({ searchHistory: [] }),

    toggleNetwork: () =>
      set((state) => ({ isDevnet: !state.isDevnet })),

    setPublicKey: (address)=> {
      set((state) => ({
        publicKey: address,
      }))
    },
    
    setConnecting: (val)=> {
      set((state) => ({
        connecting: val,
      }))
    },

    setSending: (val)=> {
      set((state) => ({
        sending: val,
      }))
    },
  }),
  {
    name: "wallet-storage",
    //storage: createJSONStorage(() => asyncStorageAdapter),
    storage: createJSONStorage(() => mmkvStorage),
  }
));