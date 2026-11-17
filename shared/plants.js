// The one list of plants for the whole app.
// The backend uses it to check requests, and the frontend uses it to draw the picker.
//
// Flowers and plants can be grown with any focus length (15 minutes or more).
// Trees take longer to grow, so each one needs a minimum focus length:
//   Pine 40 (Focus Block), Apple 50 (Deep Work), Cherry Blossom 75 (Extended Sprint), Ginkgo 90 (Ultradian).
export const PLANT_CATALOG = [
  { id: 'sunflower', name: 'Sunflower', kind: 'plant', minMinutes: 15 },
  { id: 'cactus', name: 'Cactus', kind: 'plant', minMinutes: 15 },
  { id: 'tulip', name: 'Tulip', kind: 'plant', minMinutes: 15 },
  { id: 'sakura', name: 'Sakura', kind: 'plant', minMinutes: 15 },
  { id: 'rose', name: 'Rose', kind: 'plant', minMinutes: 15 },
  { id: 'daisy', name: 'Daisy', kind: 'plant', minMinutes: 15 },
  { id: 'lavender', name: 'Lavender', kind: 'plant', minMinutes: 15 },
  { id: 'succulent', name: 'Succulent', kind: 'plant', minMinutes: 15 },
  { id: 'mushroom', name: 'Mushroom', kind: 'plant', minMinutes: 15 },
  { id: 'pine', name: 'Pine Tree', kind: 'tree', minMinutes: 40 },
  { id: 'apple', name: 'Apple Tree', kind: 'tree', minMinutes: 50 },
  { id: 'cherry', name: 'Cherry Blossom Tree', kind: 'tree', minMinutes: 75 },
  { id: 'ginkgo', name: 'Golden Ginkgo', kind: 'tree', minMinutes: 90 },
];

export const PLANT_IDS = PLANT_CATALOG.map((p) => p.id);
export const plantInfo = (id) => PLANT_CATALOG.find((p) => p.id === id);

// Most plants a user can put in the yard at once (keeps the page light).
export const YARD_LIMIT = 60;
