import { create } from 'zustand';

export type OrderPhase =
  | 'placed'
  | 'preparing'
  | 'on_the_way'
  | 'nearby'
  | 'delivered';

export type OrderSource = 'live' | 'local';

export type TrackedOrder = {
  id: string;
  restaurantName: string;
  totalINR: number;
  phase: OrderPhase;
  riderLat: number;
  riderLng: number;
  source?: OrderSource;
};

type OrderTrackingState = {
  active: TrackedOrder | null;
  setActive: (o: TrackedOrder | null) => void;
};

export const useOrderStore = create<OrderTrackingState>((set) => ({
  active: null,
  setActive: (active) => set({ active }),
}));
