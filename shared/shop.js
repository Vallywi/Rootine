// The shop catalog and the coin rule, shared by the backend (checks and prices) and the frontend (pictures and text).
//
// Coins: every collected focus session earns coins. Longer sessions pay more per minute:
//   under 25 min: 1.0 coin per minute, 25 to 49: 1.2, 50 to 74: 1.5, 75 or more: 2.0.
//   For example 15 min = 15 coins, 25 min = 30, 50 min = 75, 90 min = 180.
export const COIN_TIERS = [
  { fromSeconds: 4500, percent: 200 },
  { fromSeconds: 3000, percent: 150 },
  { fromSeconds: 1500, percent: 120 },
  { fromSeconds: 0, percent: 100 },
];
export const coinsForSeconds = (seconds) => {
  const tier = COIN_TIERS.find((t) => seconds >= t.fromSeconds);
  return Math.round((seconds * tier.percent) / 6000);
};
export const coinsForMinutes = (minutes) => coinsForSeconds(minutes * 60);

export const DEFAULT_HOUSE = 'hut';

// category: house (one is shown in the yard), fence (one runs along the back), decor (placed anywhere on the grass).
export const SHOP_ITEMS = [
  { id: 'hut', category: 'house', name: 'Tiny hut', price: 0, text: 'Your first home. It leaks a little, but it is yours.' },
  { id: 'cottage', category: 'house', name: 'Cozy cottage', price: 150, text: 'Cream walls, a red roof, and a flower box.' },
  { id: 'cabin', category: 'house', name: 'Log cabin', price: 300, text: 'Warm logs, a green roof, and a little porch.' },
  { id: 'treehouse', category: 'house', name: 'Treehouse', price: 500, text: 'A home in the branches, with a rope ladder.' },
  { id: 'castle', category: 'house', name: 'Little castle', price: 1000, text: 'Pink towers and flags for a royal gardener.' },

  { id: 'wood', category: 'fence', name: 'Wooden fence', price: 60, text: 'Simple brown planks.' },
  { id: 'picket', category: 'fence', name: 'White picket fence', price: 80, text: 'The classic cottage garden look.' },
  { id: 'stone', category: 'fence', name: 'Stone wall', price: 140, text: 'Sturdy grey stones.' },
  { id: 'hedge', category: 'fence', name: 'Flower hedge', price: 200, text: 'A green hedge full of tiny blossoms.' },

  { id: 'signpost', category: 'decor', name: 'Signpost', price: 30, text: 'Points the way to the garden.' },
  { id: 'mailbox', category: 'decor', name: 'Mailbox', price: 40, text: 'A little red mailbox.' },
  { id: 'lamp', category: 'decor', name: 'Garden lantern', price: 50, text: 'Glows softly at night.' },
  { id: 'bench', category: 'decor', name: 'Garden bench', price: 60, text: 'A place to rest between sessions.' },
  { id: 'pond', category: 'decor', name: 'Pond', price: 90, text: 'Cool water with a lily pad.' },
  { id: 'birdbath', category: 'decor', name: 'Bird bath', price: 110, text: 'Visitors with wings welcome.' },
  { id: 'scarecrow', category: 'decor', name: 'Scarecrow', price: 120, text: 'Keeps watch over your plants.' },
  { id: 'swing', category: 'decor', name: 'Swing', price: 160, text: 'A rope swing under a little frame.' },
  { id: 'windmill', category: 'decor', name: 'Windmill', price: 250, text: 'Its blades turn slowly in the breeze.' },
];
export const shopItem = (id) => SHOP_ITEMS.find((i) => i.id === id);
