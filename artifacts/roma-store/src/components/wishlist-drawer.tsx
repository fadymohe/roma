import { X, Heart, ShoppingBag, Trash2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';
import { Link } from 'wouter';

export function WishlistDrawer() {
  const { wishlist, wishlistDrawerOpen, setWishlistDrawerOpen, toggleWishlist } = useAuth();
  const { add } = useCart();
  const { isAr, t, formatPrice, dir } = useLanguage();
  const liveProducts = useLiveProducts();
  const allProducts = liveProducts.length > 0 ? liveProducts : DEFAULT_PRODUCTS;

  if (!wishlistDrawerOpen) return null;

  const wishlistedProducts = allProducts.filter((p) => wishlist.includes(p.id));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir={dir}
      onClick={() => setWishlistDrawerOpen(false)}
    >
      <div
        className="fixed bottom-0 left-0 top-0 w-full max-w-md bg-gradient-to-b from-[#141414] via-[#101010] to-[#0A0A0A] border-r border-white/10 p-6 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col justify-between text-[#F9FAFB]"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 flex items-center justify-center">
                <Heart className="size-4 fill-[#D4A5A5] text-[#D4A5A5]" />
              </div>
              <h3 className="font-bold text-base md:text-lg text-white font-display">
                {isAr ? 'قائمة الرغبات والمفضلة' : 'My Wishlist'}{' '}
                <span className="text-xs font-mono-brand text-[#D4A5A5] bg-[#D4A5A5]/10 px-2 py-0.5 rounded-full border border-[#D4A5A5]/25">
                  {wishlistedProducts.length}
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setWishlistDrawerOpen(false)}
              className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* List of items */}
          <div className="mt-4 max-h-[calc(100dvh-190px)] space-y-3 overflow-y-auto pr-1 no-scrollbar">
            {wishlistedProducts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#D4A5A5]/20 text-[#D4A5A5] shadow-inner">
                  <Heart className="size-7" />
                </div>
                <h4 className="font-bold text-white text-base">
                  {isAr ? 'قائمتك المفضلة فارغة حالياً' : 'Your wishlist is empty'}
                </h4>
                <p className="mt-1.5 text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  {isAr
                    ? 'استكشفي تشكيلتنا الفاخرة واضغطي على أيقونة القلب لحفظ المستحضرات التي تليق بجمالك.'
                    : 'Discover our luxury atelier formulations and tap the heart icon to save your favorites.'}
                </p>
                <Link
                  href="/shop"
                  onClick={() => setWishlistDrawerOpen(false)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4A5A5] hover:bg-[#C89595] px-6 py-2.5 text-xs font-bold text-[#0A0A0A] shadow-lg shadow-[#D4A5A5]/20 transition-all hover:scale-105 active:scale-95"
                >
                  <span>{isAr ? 'تصفحي المتجر' : 'Explore Store'}</span>
                  {isAr ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                </Link>
              </div>
            ) : (
              wishlistedProducts.map((product) => {
                const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 p-3 transition hover:border-[#D4A5A5]/50 bg-[#161616]/90 shadow-md group"
                  >
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={() => setWishlistDrawerOpen(false)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="size-16 rounded-xl bg-[#1D1D1D] border border-white/5 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner">
                        <img
                          src={product.imageUrl}
                          alt={displayName}
                          className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#D4A5A5] transition">
                          {displayName}
                        </h4>
                        <p className="mt-0.5 text-[10px] text-zinc-400 truncate">
                          {product.category || (isAr ? 'عناية وجمال' : 'Beauty & Cosmetics')}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#D4A5A5] font-mono-brand">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          add(product, product.variants?.[0]);
                        }}
                        className="size-9 rounded-full bg-[#D4A5A5] text-[#0A0A0A] flex items-center justify-center hover:bg-[#C89595] shadow-md transition active:scale-95"
                        title={isAr ? 'إضافة للسلة' : 'Add to Bag'}
                      >
                        <ShoppingBag className="size-4" strokeWidth={2} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleWishlist(product.id)}
                        className="size-9 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                        title={isAr ? 'إزالة من المفضلة' : 'Remove'}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {wishlistedProducts.length > 0 && (
          <div className="border-t border-white/10 pt-4 space-y-2">
            <Link
              href="/shop"
              onClick={() => setWishlistDrawerOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D4A5A5] py-3 text-xs font-bold text-[#0A0A0A] hover:bg-[#C89595] shadow-lg shadow-[#D4A5A5]/20 transition active:scale-95"
            >
              <span>{isAr ? 'متابعة التسوق' : 'Continue Shopping'}</span>
              {isAr ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
