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

// category: house (one is shown in the yard), fence (one runs along the back),
// decor (placed anywhere on the grass), pet (walks around the yard by itself).
export const SHOP_ITEMS = [
  { id: 'hut', category: 'house', name: 'Tiny hut', price: 0, text: 'Your first home. It leaks a little, but it is yours.' },
  { id: 'tent', category: 'house', name: 'Camping tent', price: 40, text: 'A cheerful striped tent. Better than a leaky hut.' },
  { id: 'cottage', category: 'house', name: 'Cozy cottage', price: 80, text: 'Cream walls, a red roof, and a flower box.' },
  { id: 'barn', category: 'house', name: 'Red barn', price: 120, text: 'A big barn with a hayloft window.' },
  { id: 'cabin', category: 'house', name: 'Log cabin', price: 160, text: 'Warm logs, a green roof, and a little porch.' },
  { id: 'mushroom', category: 'house', name: 'Mushroom house', price: 220, text: 'A round home under a spotty red cap.' },
  { id: 'treehouse', category: 'house', name: 'Treehouse', price: 260, text: 'A home in the branches, with a rope ladder.' },
  { id: 'castle', category: 'house', name: 'Little castle', price: 500, text: 'Pink towers and flags for a royal gardener.' },

  { id: 'wood', category: 'fence', name: 'Wooden fence', price: 30, text: 'Simple brown planks.' },
  { id: 'picket', category: 'fence', name: 'White picket fence', price: 45, text: 'The classic cottage garden look.' },
  { id: 'bamboo', category: 'fence', name: 'Bamboo fence', price: 55, text: 'Green canes tied with rope.' },
  { id: 'iron', category: 'fence', name: 'Iron fence', price: 70, text: 'Black bars with pointy tops.' },
  { id: 'stone', category: 'fence', name: 'Stone wall', price: 80, text: 'Sturdy grey stones.' },
  { id: 'candy', category: 'fence', name: 'Candy cane fence', price: 95, text: 'Red and white stripes. Sweet!' },
  { id: 'hedge', category: 'fence', name: 'Flower hedge', price: 110, text: 'A green hedge full of tiny blossoms.' },

  { id: 'signpost', category: 'decor', name: 'Signpost', price: 15, text: 'Points the way to the garden.' },
  { id: 'mailbox', category: 'decor', name: 'Mailbox', price: 20, text: 'A little red mailbox.' },
  { id: 'flowerbed', category: 'decor', name: 'Flower bed', price: 20, text: 'A patch of colorful blooms.' },
  { id: 'lamp', category: 'decor', name: 'Garden lantern', price: 25, text: 'Glows softly at night.' },
  { id: 'bench', category: 'decor', name: 'Garden bench', price: 30, text: 'A place to rest between sessions.' },
  { id: 'haystack', category: 'decor', name: 'Haystack', price: 30, text: 'A cozy golden pile.' },
  { id: 'picnic', category: 'decor', name: 'Picnic blanket', price: 35, text: 'With a basket and a shiny apple.' },
  { id: 'gnome', category: 'decor', name: 'Garden gnome', price: 35, text: 'Smiles at every plant.' },
  { id: 'pond', category: 'decor', name: 'Pond', price: 45, text: 'Cool water with a lily pad.' },
  { id: 'campfire', category: 'decor', name: 'Campfire', price: 50, text: 'A flickering fire ringed with stones.' },
  { id: 'birdbath', category: 'decor', name: 'Bird bath', price: 55, text: 'Visitors with wings welcome.' },
  { id: 'scarecrow', category: 'decor', name: 'Scarecrow', price: 60, text: 'Keeps watch over your plants.' },
  { id: 'well', category: 'decor', name: 'Wishing well', price: 70, text: 'Make a wish after a long session.' },
  { id: 'swing', category: 'decor', name: 'Swing', price: 80, text: 'A rope swing under a little frame.' },
  { id: 'windmill', category: 'decor', name: 'Windmill', price: 120, text: 'Its blades turn slowly in the breeze.' },
  { id: 'greenhouse', category: 'decor', name: 'Greenhouse', price: 130, text: 'A glass house full of tiny sprouts.' },
  { id: 'fountain', category: 'decor', name: 'Fountain', price: 150, text: 'Sparkling water, tier by tier.' },

  { id: 'chick', category: 'pet', name: 'Chick', price: 30, text: 'Tiny, fluffy, and always hungry.' },
  { id: 'duck', category: 'pet', name: 'Duck', price: 40, text: 'Waddles around and quacks hello.' },
  { id: 'turtle', category: 'pet', name: 'Turtle', price: 45, text: 'Slow and steady, like a good habit.' },
  { id: 'dog', category: 'pet', name: 'Puppy', price: 60, text: 'Loves to run in circles.' },
  { id: 'cat', category: 'pet', name: 'Kitten', price: 60, text: 'Strolls around like it owns the place.' },
  { id: 'bunny', category: 'pet', name: 'Bunny', price: 65, text: 'Hops between your plants.' },
  { id: 'pig', category: 'pet', name: 'Piglet', price: 75, text: 'Happy little oinker.' },
  { id: 'sheep', category: 'pet', name: 'Fluffy sheep', price: 85, text: 'A walking cloud.' },
];
export const shopItem = (id) => SHOP_ITEMS.find((i) => i.id === id);
