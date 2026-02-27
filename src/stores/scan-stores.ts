import {create} from 'zustand';

// Scan store shape
interface ScanState {

   // data
   scanned: boolean;
   scannedUrl: string;
   items: string[];

   // actions
   //GET
   getItems: ()=> string[];

   //SET 
   setItem: (param: string) => void;
   setscanned: (val: boolean) => void;
   setScannedUrl: (url:string) => void;
}

export const useScanStore = create<ScanState>(
   (set, get) => ({
     // Initial state
     items: [],
     scanned: false,
     scannedUrl: '',

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

      setscanned: (val) => {
        set({ scanned: val })
      },

      setScannedUrl: (url) => {
         set({ scannedUrl: url })
      }
   }),
);