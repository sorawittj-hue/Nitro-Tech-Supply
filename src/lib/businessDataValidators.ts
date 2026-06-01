import type { AffiliateData, FinanceData, InventoryItem, OrderItem } from '../context/AppContext';

export function parseInventoryData(value: unknown): InventoryItem[] {
  if (!Array.isArray(value)) throw new Error('Inventory payload must be an array.');
  return value.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Inventory item ${index} must be an object.`);
    return {
      id: readString(item, 'id', `inventory[${index}].id`),
      name: readString(item, 'name', `inventory[${index}].name`),
      stock: readNumber(item, 'stock', `inventory[${index}].stock`),
      threshold: readNumber(item, 'threshold', `inventory[${index}].threshold`),
      price: readNumber(item, 'price', `inventory[${index}].price`),
    };
  });
}

export function parseOrderData(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) throw new Error('Orders payload must be an array.');
  return value.map((order, index) => {
    if (!isRecord(order)) throw new Error(`Order ${index} must be an object.`);
    return {
      id: readString(order, 'id', `orders[${index}].id`),
      customer: readString(order, 'customer', `orders[${index}].customer`),
      item: readString(order, 'item', `orders[${index}].item`),
      quantity: readNumber(order, 'quantity', `orders[${index}].quantity`),
      status: readString(order, 'status', `orders[${index}].status`),
      value: readNumber(order, 'value', `orders[${index}].value`),
      date: readString(order, 'date', `orders[${index}].date`),
    };
  });
}

export function parseAffiliateData(value: unknown): AffiliateData {
  if (!isRecord(value)) throw new Error('Affiliate payload must be an object.');
  return {
    totalClicks: readNumber(value, 'totalClicks', 'affiliate.totalClicks'),
    conversions: readNumber(value, 'conversions', 'affiliate.conversions'),
    revenueTHB: readNumber(value, 'revenueTHB', 'affiliate.revenueTHB'),
  };
}

export function parseFinanceData(value: unknown): FinanceData {
  if (!isRecord(value)) throw new Error('Finance payload must be an object.');
  return {
    cashOnHand: readNumber(value, 'cashOnHand', 'finance.cashOnHand'),
  };
}

function readString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new Error(`${label} must be a string.`);
  return value;
}

function readNumber(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
