import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product, Variant } from '@workspace/api-client-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

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

const CART_STORAGE_KEY = 'roma-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  });

  // Save to local storage on any change
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch (_) {}
  }, [lines]);

  // Sync to Supabase cart_items when user is authenticated
  useEffect(() => {
    if (!user?.id) return;

    const timer = setTimeout(async () => {
      try {
        // Delete old items for this user
        await supabase.from('cart_items').delete().eq('user_id', user.id);

        if (lines.length > 0) {
          const records = lines.map((line) => ({
            user_id: user.id,
            product_id: String(line.product.id),
            quantity: line.quantity,
          }));
          await supabase.from('cart_items').insert(records);
        }
      } catch (e) {
        // Quiet note for RLS or offline
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [lines, user?.id]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
      add: (product, variant) =>
        setLines((current) => {
          const found = current.find(
            (line) => line.product.id === product.id && line.variant?.id === variant?.id
          );
          if (found) {
            return current.map((line) =>
              line === found ? { ...line, quantity: line.quantity + 1 } : line
            );
          }
          return [...current, { product, variant, quantity: 1 }];
        }),
      remove: (productId, variantId) =>
        setLines((current) =>
          current.filter(
            (line) => !(line.product.id === productId && line.variant?.id === variantId)
          )
        ),
      setQuantity: (productId, quantity, variantId) =>
        setLines((current) =>
          current.map((line) =>
            line.product.id === productId && line.variant?.id === variantId
              ? { ...line, quantity: Math.max(1, quantity) }
              : line
          )
        ),
      clear: () => {
        setLines([]);
        if (user?.id) {
          supabase.from('cart_items').delete().eq('user_id', user.id).catch(() => {});
        }
      },
    }),
    [lines, user?.id]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}