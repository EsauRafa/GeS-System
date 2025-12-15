import { create } from 'zustand';

export const useRDOStore = create((set) => ({
  rdos: [],
  addRDO: (rdo) => set((state) => ({ rdos: [...state.rdos, rdo] })),
}));
