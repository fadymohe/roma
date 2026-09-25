import { X, Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { PRODUCTS } from '@/lib/catalog-data';
import { Link } from 'wouter';

export function WishlistDrawer() {
  const { wishlist, wishlistDrawerOpen, setWishlistDrawerOpen, toggleWishlist } = useAuth();
  const { add } = useCart();

  if (!wishlistDrawerOpen) return null;

  const wishlistedProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={() => setWishlistDrawerOpen(false)}
    >
      <div
        className="fixed bottom-0 left-0 top-0 w-full max-w-md bg-background p-6 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Heart className="size-5 fill-primary text-primary" />
              <h3 className="font-bold text-lg text-foreground">قائمة الرغبات والمفضلة ({wishlistedProducts.length})</h3>
            </div>
            <button
              type="button"
              onClick={() => setWishlistDrawerOpen(false)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* List */}
          <div className="mt-4 max-h-[calc(100dvh-180px)] space-y-3 overflow-y-auto pr-1">
            {wishlistedProducts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
                  <Heart className="size-6" />
                </div>
                <h4 className="font-bold text-foreground">قائمتك المفضلة فارغة حالياً</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  استكشفي تشكيلتنا الفاخرة واضغطي على أيقونة القلب لحفظ ما يعجبكِ.
                </p>
                <Link
                  href="/shop"
                  onClick={() => setWishlistDrawerOpen(false)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#4E7A5A] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#3F6649]"
                >
                  تصفحي المتجر <ArrowLeft className="size-3.5" />
                </Link>
              </div>
            ) : (
              wishlistedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-border p-3 transition hover:border-[#76A080]/50 bg-white"
                >
                  <Link
                    href={`/product/${product.slug}`}
                    onClick={() => setWishlistDrawerOpen(false)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="size-16 rounded-2xl bg-[#E8EFEA] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.nameAr}
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate hover:text-[#4E7A5A]">
                        {product.nameAr}
                      </h4>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {product.volume || '50 ml / 1.7 fl oz'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#4E7A5A] font-mono-brand">
                        {product.price} ج.م
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        add({
                          productId: product.id,
                          quantity: 1,
                          variantId: product.variants[0]?.id,
                        });
                      }}
                      className="size-9 rounded-full bg-[#76A080] text-white flex items-center justify-center hover:bg-[#527E5F] shadow-sm transition active:scale-95"
                      title="إضافة للسلة"
                    >
                      <ShoppingBag className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      className="size-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition"
                      title="إزالة من المفضلة"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {wishlistedProducts.length > 0 && (
          <div className="border-t border-border pt-4">
            <Link
              href="/shop"
              onClick={() => setWishlistDrawerOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E8EFEA] py-3 text-xs font-bold text-[#2A4331] hover:bg-[#DEE6E0] transition"
            >
              متابعة التسوق
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
