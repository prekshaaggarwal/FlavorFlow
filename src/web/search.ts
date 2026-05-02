import {
  type DietaryTag,
  RESTAURANTS_WEB,
  type WebMenuItem,
  type WebRestaurant,
} from './data';

export type ParsedQuery = {
  rawText: string;
  tokens: string[];
  spice: 'mild' | 'spicy' | 'fire' | null;
  vegOnly: boolean;
  veganOnly: boolean;
  nonVegOnly: boolean;
  priceMaxINR: number | null;
  caloriesMax: number | null;
  fast: boolean;
  cuisineHints: string[];
};

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'or',
  'the',
  'of',
  'for',
  'with',
  'show',
  'me',
  'i',
  'want',
  'find',
  'some',
  'any',
  'please',
  'can',
  'you',
  'tonight',
  'today',
  'now',
  'order',
  'get',
  'looking',
  'craving',
  'around',
  'near',
  'food',
  'something',
  'thing',
  'anything',
  'have',
  'is',
  'in',
  'to',
  'this',
  'that',
  'my',
  'on',
  'at',
  'rs',
  'inr',
]);

const SPICE_FIRE = ['fire', 'extra hot', 'super spicy', 'hottest', 'very spicy', 'extra spicy', 'spiciest'];
const SPICE_HOT = ['spicy', 'hot', 'fiery', 'kick', 'chilli', 'chili', 'tikha', 'masala', 'jalfrezi'];
const SPICE_MILD = ['mild', 'no spice', 'not spicy'];

const VEG_TOKENS = ['veg', 'vegetarian'];
const VEGAN_TOKENS = ['vegan', 'plant-based', 'plantbased'];
const NON_VEG_TOKENS = ['non-veg', 'non veg', 'nonveg', 'meaty', 'meat'];

const FAST_TOKENS = ['quick', 'fast', 'asap', '15 min', '20 min', '30 min', 'under 30'];

const CUISINE_KEYWORDS: Record<string, string[]> = {
  italian: ['italian', 'pasta', 'pizza', 'spaghetti', 'penne', 'fettuccine', 'lasagna', 'ravioli', 'arrabbiata', 'carbonara', 'aglio', 'olio', 'tiramisu'],
  pizza: ['pizza', 'margherita', 'pepperoni', 'calzone'],
  pasta: ['pasta', 'spaghetti', 'penne', 'fettuccine', 'lasagna', 'ravioli', 'arrabbiata', 'carbonara', 'aglio', 'olio', 'noodles' /* loose */],
  japanese: ['japanese', 'sushi', 'ramen', 'maki', 'aburi', 'tonkotsu', 'edamame', 'miso', 'nigiri', 'tempura', 'udon'],
  korean: ['korean', 'bibimbap', 'gochujang', 'kimchi', 'tteokbokki', 'bulgogi', 'kfc'],
  thai: ['thai', 'pad thai', 'tom yum', 'green curry', 'red curry', 'drunken'],
  chinese: ['chinese', 'hakka', 'manchurian', 'schezwan', 'sweet sour', 'lotus'],
  mexican: ['mexican', 'taco', 'tacos', 'burrito', 'quesadilla', 'guacamole', 'churros', 'salsa', 'tortilla'],
  american: ['burger', 'burgers', 'wings', 'fries', 'shake', 'milkshake', 'sundae'],
  hyderabadi: ['biryani', 'haleem', 'salan', 'dum'],
  'south indian': ['dosa', 'idli', 'sambar', 'vada', 'kaapi', 'filter coffee', 'uthapam'],
  'middle eastern': ['shawarma', 'falafel', 'hummus', 'pita', 'kebab', 'baklava', 'harissa', 'tahini'],
  vietnamese: ['banh mi', 'pho', 'goi cuon', 'summer roll'],
  brunch: ['pancake', 'pancakes', 'waffle', 'waffles', 'benedict', 'avocado toast', 'eggs'],
  desserts: ['cake', 'cheesecake', 'brownie', 'ice cream', 'lava', 'macaron', 'cinnamon roll', 'donut', 'sundae', 'baklava', 'tiramisu', 'sweet'],
  healthy: ['salad', 'bowl', 'quinoa', 'acai', 'green juice', 'protein', 'caesar'],
};

function extractMaxPrice(text: string): number | null {
  const m1 = text.match(/(?:under|below|less than|<=|<|upto|up to|cheaper than|max|maximum)\s*(?:rs\.?|inr|₹|rupees?)?\s*(\d{2,4})/i);
  if (m1) return parseInt(m1[1], 10);
  const m2 = text.match(/(?:rs\.?|inr|₹|rupees?)\s*(\d{2,4})/i);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

function extractMaxCalories(text: string): number | null {
  const m = text.match(/(?:under|below|less than|<=|<|max|maximum)\s*(\d{2,4})\s*(?:cal|kcal|calories)/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function parseQuery(text: string): ParsedQuery {
  const lower = text.toLowerCase();

  let spice: ParsedQuery['spice'] = null;
  if (SPICE_FIRE.some((s) => lower.includes(s))) spice = 'fire';
  else if (SPICE_HOT.some((s) => lower.includes(s))) spice = 'spicy';
  else if (SPICE_MILD.some((s) => lower.includes(s))) spice = 'mild';

  const nonVegOnly = NON_VEG_TOKENS.some((t) => lower.includes(t));
  const vegOnly = !nonVegOnly && VEG_TOKENS.some((t) => new RegExp(`\\b${t}\\b`).test(lower));
  const veganOnly = VEGAN_TOKENS.some((t) => lower.includes(t));

  const priceMaxINR = extractMaxPrice(lower);
  const caloriesMax = extractMaxCalories(lower);
  const fast = FAST_TOKENS.some((t) => lower.includes(t));

  const cuisineHints: string[] = [];
  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) cuisineHints.push(cuisine);
  }

  const tokens = lower
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  return {
    rawText: text,
    tokens,
    spice,
    vegOnly,
    veganOnly,
    nonVegOnly,
    priceMaxINR,
    caloriesMax,
    fast,
    cuisineHints,
  };
}

export function isQueryEmpty(q: ParsedQuery) {
  return (
    q.tokens.length === 0 &&
    !q.spice &&
    !q.vegOnly &&
    !q.veganOnly &&
    !q.nonVegOnly &&
    !q.priceMaxINR &&
    !q.caloriesMax &&
    !q.fast &&
    q.cuisineHints.length === 0
  );
}

function dietaryHas(item: WebMenuItem, tag: DietaryTag) {
  return (item.dietary ?? []).includes(tag);
}

function etaUpper(restaurant: WebRestaurant) {
  const m = restaurant.etaMins.match(/(\d+)\s*[-–]?\s*(\d+)?/);
  if (!m) return 30;
  const upper = m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10);
  return upper;
}

export type ScoredDish = {
  restaurant: WebRestaurant;
  item: WebMenuItem;
  score: number;
  reasons: string[];
};

export function scoreItem(
  item: WebMenuItem,
  restaurant: WebRestaurant,
  q: ParsedQuery
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const haystack = [
    item.name,
    item.description,
    ...restaurant.cuisines,
    ...restaurant.tags,
    restaurant.name,
  ]
    .join(' ')
    .toLowerCase();

  // Hard filters: bail out if violated.
  if (q.vegOnly && !item.veg) return { score: -1, reasons };
  if (q.nonVegOnly && item.veg) return { score: -1, reasons };
  if (q.veganOnly && !dietaryHas(item, 'vegan')) return { score: -1, reasons };
  if (q.priceMaxINR !== null && item.priceINR > q.priceMaxINR) return { score: -1, reasons };
  if (q.caloriesMax !== null && (item.calories ?? 0) > q.caloriesMax)
    return { score: -1, reasons };

  // Token matching with priority: name > description > cuisine > restaurant tag.
  for (const tok of q.tokens) {
    if (item.name.toLowerCase().includes(tok)) {
      score += 10;
      reasons.push(`matches "${tok}" in name`);
    } else if (item.description.toLowerCase().includes(tok)) {
      score += 4;
    } else if (restaurant.cuisines.some((c) => c.toLowerCase().includes(tok))) {
      score += 6;
    } else if (restaurant.tags.some((t) => t.toLowerCase().includes(tok))) {
      score += 3;
    } else if (haystack.includes(tok)) {
      score += 1;
    }
  }

  // Cuisine hints (e.g. "italian" → bias Italian items)
  for (const hint of q.cuisineHints) {
    if (
      restaurant.cuisines.some((c) => c.toLowerCase().includes(hint)) ||
      restaurant.tags.some((t) => t.toLowerCase().includes(hint)) ||
      restaurant.name.toLowerCase().includes(hint)
    ) {
      score += 5;
    }
    if (item.name.toLowerCase().includes(hint)) score += 4;
  }

  // Spice scoring
  const spiceLevel = item.spiceLevel ?? 0;
  if (q.spice === 'fire') {
    if (spiceLevel >= 3) {
      score += 12;
      reasons.push('fire-level heat');
    } else if (spiceLevel >= 2) score += 6;
    else if (spiceLevel === 0) score -= 6;
  } else if (q.spice === 'spicy') {
    if (spiceLevel >= 3) {
      score += 10;
      reasons.push('properly spicy');
    } else if (spiceLevel === 2) {
      score += 8;
      reasons.push('spicy');
    } else if (spiceLevel === 1) score += 2;
    else if (spiceLevel === 0) score -= 5;
  } else if (q.spice === 'mild') {
    if (spiceLevel <= 1) score += 4;
    else score -= 4;
  }

  // Speed bias
  if (q.fast) {
    const upper = etaUpper(restaurant);
    if (upper <= 25) score += 4;
    else if (upper <= 35) score += 1;
    else score -= 2;
  }

  // Popular items get a tiny nudge so well-loved dishes float up
  if (item.popular) score += 1;

  return { score, reasons };
}

export function searchDishes(text: string): {
  query: ParsedQuery;
  results: ScoredDish[];
} {
  const query = parseQuery(text);
  if (isQueryEmpty(query)) return { query, results: [] };

  const results: ScoredDish[] = [];
  for (const restaurant of RESTAURANTS_WEB) {
    for (const item of restaurant.menu) {
      const { score, reasons } = scoreItem(item, restaurant, query);
      if (score > 0) results.push({ restaurant, item, score, reasons });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return { query, results };
}

export function describeQuery(q: ParsedQuery): string[] {
  const bits: string[] = [];
  if (q.spice === 'fire') bits.push('🔥 fire-level');
  else if (q.spice === 'spicy') bits.push('🌶️ spicy');
  else if (q.spice === 'mild') bits.push('mild');
  if (q.vegOnly) bits.push('veg only');
  if (q.veganOnly) bits.push('vegan');
  if (q.nonVegOnly) bits.push('non-veg');
  if (q.priceMaxINR) bits.push(`under ₹${q.priceMaxINR}`);
  if (q.caloriesMax) bits.push(`≤ ${q.caloriesMax} kcal`);
  if (q.fast) bits.push('fast (~30 min)');
  if (q.cuisineHints.length) bits.push(...q.cuisineHints.map((c) => `cuisine: ${c}`));
  return bits;
}
