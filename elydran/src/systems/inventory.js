// InventorySystem: itens empilháveis e moedas
import { ITEMS } from '../data/items.js';

export class Inventory {
  constructor(data) { this.items = {}; this.coins = 0; if (data) { this.coins = data.coins | 0; for (const k in data.items || {}) if (ITEMS[k]) this.items[k] = Math.max(0, Math.min(99, data.items[k] | 0)); } }
  add(id, n) { if (!ITEMS[id]) return; this.items[id] = Math.min(99, (this.items[id] || 0) + (n || 1)); }
  remove(id, n) { if (!this.items[id]) return false; this.items[id] -= n || 1; if (this.items[id] <= 0) delete this.items[id]; return true; }
  count(id) { return this.items[id] || 0; }
  list() { return Object.keys(this.items).filter(k => this.items[k] > 0).sort((a, b) => ['consumable', 'weapon', 'quest'].indexOf(ITEMS[a].kind) - ['consumable', 'weapon', 'quest'].indexOf(ITEMS[b].kind)); }
  toJSON() { return { coins: this.coins, items: { ...this.items } }; }
}
