import {create} from 'zustand';

// Scan store shape
interface ScanState {

   // data
   items: string[];

   // actions
   //GET
   getItems: ()=> string[] 

   //SET
   setItem: (param: string) => void
}

export const useScanStore = create<ScanState>(
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
      )}
   }),
);