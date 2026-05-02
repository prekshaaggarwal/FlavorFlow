export type DietTag = 'veg' | 'non-veg' | 'vegan';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceINR: number;
  veg: boolean;
  popular?: boolean;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisines: string[];
  rating: number;
  etaMins: string;
  imageTint: string;
  tags: string[];
  deliveryFeeINR: number;
  menu: MenuItem[];
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Biryani Brotherhood',
    cuisines: ['Hyderabadi', 'North Indian'],
    rating: 4.6,
    etaMins: '25–35 min',
    imageTint: '#7C3AED',
    tags: ['veg', 'spicy'],
    deliveryFeeINR: 39,
    menu: [
      {
        id: 'm1',
        name: 'Dum Gosht Biryani',
        description: 'Slow-cooked lamb, fragrant basmati, sealed handi.',
        priceINR: 289,
        veg: false,
        popular: true,
      },
      {
        id: 'm2',
        name: 'Subz Hyderabadi',
        description: 'Seasonal vegetables, mint, browned onions.',
        priceINR: 219,
        veg: true,
      },
      {
        id: 'm3',
        name: 'Mirchi Ka Salan',
        description: 'Roasted chilli peanut curry — sharp and nutty.',
        priceINR: 129,
        veg: true,
      },
    ],
  },
  {
    id: 'r2',
    name: 'Neon Slice Lab',
    cuisines: ['Pizza', 'Italian'],
    rating: 4.4,
    etaMins: '30–40 min',
    imageTint: '#F97316',
    tags: ['cheesy', 'late-night'],
    deliveryFeeINR: 49,
    menu: [
      {
        id: 'm4',
        name: 'Charred Pepperoni',
        description: 'San Marzano, fior di latte, cup-and-char pepperoni.',
        priceINR: 349,
        veg: false,
        popular: true,
      },
      {
        id: 'm5',
        name: 'Wild Mushroom',
        description: 'Truffle oil, taleggio, thyme.',
        priceINR: 379,
        veg: true,
      },
    ],
  },
  {
    id: 'r3',
    name: 'Sakura Bowls',
    cuisines: ['Japanese', 'Healthy'],
    rating: 4.7,
    etaMins: '20–30 min',
    imageTint: '#0EA5E9',
    tags: ['healthy', 'low-oil'],
    deliveryFeeINR: 29,
    menu: [
      {
        id: 'm6',
        name: 'Salmon Aburi Bowl',
        description: 'Miso barley, pickles, sesame crunch.',
        priceINR: 399,
        veg: false,
        popular: true,
      },
      {
        id: 'm7',
        name: 'Tofu Katsu Curry',
        description: 'Panko tofu, heirloom carrots, short grain.',
        priceINR: 279,
        veg: true,
      },
    ],
  },
  {
    id: 'r4',
    name: 'Midnight Dosai Co.',
    cuisines: ['South Indian', 'Street food'],
    rating: 4.5,
    etaMins: '15–25 min',
    imageTint: '#10B981',
    tags: ['veg', 'comfort'],
    deliveryFeeINR: 19,
    menu: [
      {
        id: 'm8',
        name: 'Podi Molaga Dosa',
        description: 'Ghee-roasted millets, gunpowder chutney.',
        priceINR: 149,
        veg: true,
        popular: true,
      },
      {
        id: 'm9',
        name: 'Filter Kaapi Float',
        description: 'Cold brew jaggery, vanilla foam.',
        priceINR: 99,
        veg: true,
      },
    ],
  },
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}

export type HomeFilterId = 'all' | 'veg' | 'topRated' | 'fast';

/** First numeric chunk in ETA string, e.g. "25–35 min" → 25 */
export function etaFirstMinutes(eta: string): number {
  const match = eta.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
}

export function filterRestaurants(
  list: Restaurant[],
  filterId: HomeFilterId
): Restaurant[] {
  if (filterId === 'veg') return list.filter((r) => r.menu.some((m) => m.veg));
  if (filterId === 'topRated') return list.filter((r) => r.rating >= 4.5);
  if (filterId === 'fast')
    return list.filter((r) => etaFirstMinutes(r.etaMins) <= 30);
  return list;
}
