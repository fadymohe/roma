import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product, Variant } from '@workspace/api-client-react';

export type CartLine = {
  product: Product;
  variant?: Variant;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, variant?: Variant) => void;
  remove: (productId: number, variantId?: number) => void;
  setQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = window.localStorage.getItem('roma-cart');
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch { return []; }
  });

  useEffect(() => { window.localStorage.setItem('roma-cart', JSON.stringify(lines)); }, [lines]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    add: (product, variant) => setLines((current) => {
      const found = current.find((line) => line.product.id === product.id && line.variant?.id === variant?.id);
      if (found) return current.map((line) => line === found ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { product, variant, quantity: 1 }];
    }),
    remove: (productId, variantId) => setLines((current) => current.filter((line) => !(line.product.id === productId && line.variant?.id === variantId))),
    setQuantity: (productId, quantity, variantId) => setLines((current) => current.map((line) => line.product.id === productId && line.variant?.id === variantId ? { ...line, quantity: Math.max(1, quantity) } : line)),
    clear: () => setLines([]),
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}