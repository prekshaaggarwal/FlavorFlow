import { create } from 'zustand';

import type { MenuItem } from '../services/restaurants';

export type CartLine = {
  key: string;
  restaurantId: string;
  restaurantName: string;
  item: MenuItem;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  addLine: (
    restaurantId: string,
    restaurantName: string,
    item: MenuItem,
    quantity?: number
  ) => void;
  decrementLine: (key: string) => void;
  removeLine: (key: string) => void;
  clear: () => void;
};

const makeKey = (restaurantId: string, menuId: string) => `${restaurantId}:${menuId}`;

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  addLine: (restaurantId, restaurantName, item, quantity = 1) => {
    const key = makeKey(restaurantId, item.id);
    const existing = get().lines.find((l) => l.key === key);
    if (existing) {
      set({
        lines: get().lines.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + quantity } : l
        ),
      });
      return;
    }
    const first = get().lines[0];
    if (first && first.restaurantId !== restaurantId) {
      set({
        lines: [
          {
            key,
            restaurantId,
            restaurantName,
            item,
            quantity,
          },
        ],
      });
      return;
    }
    set({
      lines: [
        ...get().lines,
        {
          key,
          restaurantId,
          restaurantName,
          item,
          quantity,
        },
      ],
    });
  },
  decrementLine: (key) => {
    const line = get().lines.find((l) => l.key === key);
    if (!line) return;
    if (line.quantity <= 1) {
      set({ lines: get().lines.filter((l) => l.key !== key) });
      return;
    }
    set({
      lines: get().lines.map((l) =>
        l.key === key ? { ...l, quantity: l.quantity - 1 } : l
      ),
    });
  },
  removeLine: (key) =>
    set({ lines: get().lines.filter((l) => l.key !== key) }),
  clear: () => set({ lines: [] }),
}));
