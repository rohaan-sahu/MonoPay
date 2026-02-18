import {create} from 'zustand';
import {persist,createJSONStorage} from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storageMMKV';

// store shape
interface TemplateState {

   // data
   items: string[];

   // actions
   //GET
   getItems: ()=> string[] 

   //SET
   setItem: (param: string) => void
}

export const useTemplateStore = create<TemplateState>()(
 persist(
    (set, get) => ({
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
            })
      )},
    }),
    {
      name: "template-storage",
      storage: createJSONStorage(() => mmkvStorage)
    }
 )
);