import { create } from "zustand";

// store shape
interface TemplateState {
  // data
  state1: string[];
  state2: string[];
  state3: boolean;

  // actions
  doSomething: (param1: string) => void;
  isSomething: (param2: string) => boolean;
  addSomething: (param2: string) => void;
  removeSomething: (param2: string) => void;
  clearSomething: () => void;
  trySomething: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  state1: [],
  state2: [],
  state3: false,

  // Actions — these modify the state
  // GET state
  isSomething: (paramX) => get().state1.includes(paramX),

  // SET state
  doSomething: (paramY) => {
    set((stateWhole) => ({
      state1: stateWhole.state1.includes(paramY)
        ? stateWhole.state1
        : [paramY, ...stateWhole.state1],
    }));
  },
  addSomething: (paramY) => {
    set((stateWhole) => ({
      state2: [paramY, ...stateWhole.state2.filter((a) => a != paramY)].slice(
        0,
        20,
      ),
    }));
  },
  removeSomething: (paramZ) => {
    set((stateWhole) => ({
      state2: stateWhole.state2.filter((a) => a !== paramZ),
    }));
  },

  clearSomething: () => {
    set({ state1: [] });
  },

  trySomething: () => {
    set((stateWhole) => ({
      // Return something
    }));
  },
}));
