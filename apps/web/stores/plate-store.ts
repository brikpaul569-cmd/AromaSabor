import { create } from 'zustand';

export interface CategoryItem {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  portionGrams?: number;
  pricePerPortion: number;
  unit: string;
  isAvailable: boolean;
}

export interface CategoryInfo {
  _id: string;
  id: string;
  label: string;
  maxItems: number;
}

interface PlateStore {
  selections: Record<string, CategoryItem[]>;
  guestCount: number;
  initCategories: (categories: CategoryInfo[]) => void;
  selectItem: (categoryId: string, item: CategoryItem, maxItems: number) => void;
  deselectItem: (categoryId: string, itemId: string) => void;
  clearAll: () => void;
  setGuestCount: (count: number) => void;
  selectedItems: () => (CategoryItem & { categoryId: string })[];
  isSelected: (categoryId: string, itemId: string) => boolean;
  getSelectionCount: (categoryId: string) => number;
}

export const usePlateStore = create<PlateStore>((set, get) => ({
  selections: {},
  guestCount: 1,

  initCategories: (categories) => {
    const updates: Record<string, CategoryItem[]> = {};
    for (const cat of categories) {
      // Preserve existing selections for categories that still exist
      updates[cat._id] = get().selections[cat._id] || [];
    }
    set({ selections: updates });
  },

  selectItem: (categoryId, item, maxItems) =>
    set((state) => {
      const current = state.selections[categoryId] || [];
      if (current.some((s) => s._id === item._id)) return state;
      if (current.length >= maxItems) return state;
      return {
        selections: { ...state.selections, [categoryId]: [...current, item] },
      };
    }),

  deselectItem: (categoryId, itemId) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [categoryId]: (state.selections[categoryId] || []).filter((s) => s._id !== itemId),
      },
    })),

  clearAll: () => {
    const { selections } = get();
    const cleared: Record<string, CategoryItem[]> = {};
    for (const key of Object.keys(selections)) {
      cleared[key] = [];
    }
    set({ selections: cleared });
  },

  setGuestCount: (count) => {
    const sanitized = isNaN(count) || count < 1 ? 1 : Math.floor(count);
    set({ guestCount: sanitized });
  },

  selectedItems: () => {
    const { selections } = get();
    const result: (CategoryItem & { categoryId: string })[] = [];
    for (const [catId, items] of Object.entries(selections)) {
      for (const item of items) {
        result.push({ ...item, categoryId: catId });
      }
    }
    return result;
  },

  isSelected: (categoryId, itemId) => {
    const { selections } = get();
    return (selections[categoryId] || []).some((s) => s._id === itemId);
  },

  getSelectionCount: (categoryId) => {
    return (get().selections[categoryId] || []).length;
  },
}));
