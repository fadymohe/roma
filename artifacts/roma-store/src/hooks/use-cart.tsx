import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, Variant } from '@workspace/api-client-react';
import { supabase } from '@/lib/supabase';

export type CartLine = {
  product: Product;
  variant?: Variant;
  quantity: number;
};

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, variant?: Variant) => void;
  remove: (productId: number, variantId?: number) => void;
  setQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clear: () => void;
  syncWithSupabase: (userId?: string | null) => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      count: 0,
      subtotal: 0,

      add: (product, variant) => {
        const { lines } = get();
        const existingIndex = lines.findIndex(
          (line) => line.product.id === product.id && line.variant?.id === variant?.id
        );

        let updatedLines: CartLine[];
        if (existingIndex > -1) {
          updatedLines = lines.map((item, idx) =>
            idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          updatedLines = [...lines, { product, variant, quantity: 1 }];
        }

        const count = updatedLines.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = updatedLines.reduce(
          (sum, item) => sum + (Number(item.product.price) || 0) * item.quantity,
          0
        );

        set({ lines: updatedLines, count, subtotal });
      },

      remove: (productId, variantId) => {
        const { lines } = get();
        const updatedLines = lines.filter(
          (line) => !(line.product.id === productId && line.variant?.id === variantId)
        );
        const count = updatedLines.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = updatedLines.reduce(
          (sum, item) => sum + (Number(item.product.price) || 0) * item.quantity,
          0
        );
        set({ lines: updatedLines, count, subtotal });
      },

      setQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().remove(productId, variantId);
          return;
        }

        const { lines } = get();
        const updatedLines = lines.map((line) =>
          line.product.id === productId && line.variant?.id === variantId
            ? { ...line, quantity }
            : line
        );
        const count = updatedLines.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = updatedLines.reduce(
          (sum, item) => sum + (Number(item.product.price) || 0) * item.quantity,
          0
        );
        set({ lines: updatedLines, count, subtotal });
      },

      clear: () => {
        set({ lines: [], count: 0, subtotal: 0 });
      },

      syncWithSupabase: async (userId?: string | null) => {
        if (!userId) return;
        try {
          const { lines } = get();
          // Upsert or clear in Supabase cart_items
          await supabase.from('cart_items').delete().eq('user_id', userId);
          if (lines.length > 0) {
            const records = lines.map((line) => ({
              user_id: userId,
              product_id: String(line.product.id),
              quantity: line.quantity,
              variant_info: line.variant ? { id: line.variant.id, nameAr: line.variant.nameAr } : null,
            }));
            await supabase.from('cart_items').insert(records);
          }
        } catch (e) {
          // Gracefully suppress network/offline errors
          console.warn('Supabase cart sync note:', e);
        }
      },
    }),
    {
      name: 'roma-luxury-cart-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lines: state.lines,
        count: state.count,
        subtotal: state.subtotal,
      }),
    }
  )
);

// Backward-compatible hook alias matching React Context pattern
export function useCart() {
  const store = useCartStore();
  return {
    lines: store.lines,
    count: store.count,
    subtotal: store.subtotal,
    add: store.add,
    remove: store.remove,
    setQuantity: store.setQuantity,
    clear: store.clear,
    syncWithSupabase: store.syncWithSupabase,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}