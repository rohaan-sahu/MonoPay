import {create} from 'zustand';

// Supabase store shape
interface SupabaseState {

   // data
   items: string[];

   // actions
   //GET
   getItems: ()=> string[] 

   //SET
   setItem: (param: string) => void
}

export const useSupabaseStore = create<SupabaseState>((set, get) => ({
  // Initial state
  items: [],

  // GET state
  getItems: () => get().items,

  // SET state
  setItem: (paramY) => {
       set((pastState) => ({
               items: pastState.items.includes(paramY)?
                   pastState.items
                   :[paramY,...pastState.items]
       }))
   }

}));