/**
 * Calculates the total quotation for a proposal item list.
 *
 * Pricing rules (invariants):
 *  1. Line total = unit price × quantity (exact product)
 *  2. Subtotal = sum of all line totals (exact sum)
 *  3. Tax (IVA) = 16% of subtotal, half-up rounded to 2 decimals
 *  4. Total = subtotal + tax (exact sum)
 *  5. Every item must have price ≥ 0 and quantity ≥ 1
 *  6. Empty items list returns { subtotal: 0, tax: 0, total: 0 }
 */

const TAX_RATE = 0.16;

function roundHalfUp(value: number): number {
  const factor = 100;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export interface QuotationResult {
  subtotal: number;
  tax: number;
  total: number;
}

export interface QuotationItem {
  price: number;
  quantity: number;
}

export function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calculateQuotation(items: QuotationItem[]): QuotationResult {
  if (items.length === 0) {
    return { subtotal: 0, tax: 0, total: 0 };
  }

  for (const item of items) {
    if (item.price < 0) throw new Error('Price must be non-negative');
    if (item.quantity < 1) throw new Error('Quantity must be at least 1');
  }

  const subtotal = items.reduce((acc, item) => acc + roundHalfUp(item.price * item.quantity), 0);
  const tax = roundHalfUp(subtotal * TAX_RATE);
  const total = subtotal + tax;

  return { subtotal, tax, total };
}
