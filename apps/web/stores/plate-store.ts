import { create } from 'zustand';

type Category = 'entrada' | 'plato_fuerte' | 'guarnicion' | 'postre';

interface PlateItem {
  _id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  weight?: number;
}

interface PlateStore {
  selections: Record<Category, PlateItem | null>;
  guestCount: number;
  selectItem: (item: PlateItem) => void;
  deselectItem: (category: Category) => void;
  clearAll: () => void;
  setGuestCount: (count: number) => void;
  selectedItems: () => PlateItem[];
  isSelected: (item: PlateItem) => boolean;
}

export const usePlateStore = create<PlateStore>((set, get) => ({
  selections: {
    entrada: null,
    plato_fuerte: null,
    guarnicion: null,
    postre: null,
  },
  guestCount: 1,

  selectItem: (item) =>
    set((state) => ({
      selections: { ...state.selections, [item.category]: item },
    })),

  deselectItem: (category) =>
    set((state) => ({
      selections: { ...state.selections, [category]: null },
    })),

  clearAll: () =>
    set({
      selections: {
        entrada: null,
        plato_fuerte: null,
        guarnicion: null,
        postre: null,
      },
    }),

  setGuestCount: (count) => {
    const sanitized = isNaN(count) || count < 1 ? 1 : Math.floor(count);
    set({ guestCount: sanitized });
  },

  selectedItems: () => {
    const { selections } = get();
    return Object.values(selections).filter((s): s is PlateItem => s !== null);
  },

  isSelected: (item) => {
    const { selections } = get();
    return selections[item.category]?._id === item._id;
  },
}));
