import { Link } from 'wouter';
import { Heart, Plus, Star, Check } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/lib/catalog-data';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';

export function ProductCard({ product }: { product: Product; index?: number }) {
  const { add } = useCart();
  const { isWishlisted, toggleWishlist } = useAuth();
  const { t, isAr, formatPrice } = useLanguage();
  const [justAdded, setJustAdded] = useState(false);

  if (!product || typeof product !== 'object' || !product.id) {
    return null;
  }

  const favorited = isWishlisted(product.id);
  const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
  const displayBadge = isAr ? product.badge : (product.badgeEn || product.badge);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(product, product.variants?.[0]);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <article
      data-testid={`card-product-${product.id}`}
      className="roma-card group relative flex flex-col justify-between rounded-[28px] border border-[#EFE8DE] bg-white p-3.5 shadow-xs transition-all duration-300 hover:border-[#D48B88]/60 hover:shadow-xl hover:shadow-[#4A1525]/5"
    >
      {/* Product Image Area with soft blush ivory background */}
      <div className="relative aspect-[0.95] w-full overflow-hidden rounded-[22px] bg-[#F8EBEA]/70 flex items-center justify-center p-3">
        <Link
          href={`/product/${product.slug}`}
          data-testid={`link-product-${product.id}`}
          className="block h-full w-full"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={displayName}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                if (product.imageUrl?.startsWith('/uploads/') && !target.src.includes('raw.githubusercontent.com')) {
                  target.src = `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public${product.imageUrl}`;
                }
              }}
              className="roma-image h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-secondary via-muted to-accent/30 rounded-2xl" />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute right-3 top-3 flex flex-col gap-1 z-10 pointer-events-none">
          {displayBadge && (
            <span
              data-testid={`badge-product-${product.id}`}
              className="rounded-full bg-[#4A1525] px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
            >
              {displayBadge}
            </span>
          )}
          {discountPercent && (
            <span className="rounded-full bg-[#D48B88] px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
              {isAr ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`}
            </span>
          )}
        </div>

        {/* Wishlist Button - Circular floating icon */}
        <button
          type="button"
          aria-pressed={favorited}
          aria-label={`Favorite ${displayName}`}
          data-testid={`button-favorite-${product.id}`}
          onClick={handleFavoriteClick}
          className="absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground backdrop-blur-md shadow-xs transition-all hover:scale-110 active:scale-95 hover:bg-white"
        >
          <Heart
            className={`size-4 transition-colors ${
              favorited ? 'fill-[#D48B88] text-[#D48B88]' : 'text-foreground/70 hover:text-[#4A1525]'
            }`}
            strokeWidth={1.5}
          />
        </button>
      </div>

      {/* Product Information */}
      <div className="pt-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
            <span className="font-medium text-xs text-[#D48B88]">
              {product.stock && product.stock <= 5 ? (
                <span className="text-amber-700 font-bold">
                  {isAr ? `متبقي ${product.stock} فقط!` : `Only ${product.stock} left!`}
                </span>
              ) : (
                <span className="text-[#4A1525]/70">
                  {isAr ? 'عناية طبيعية فاخرة' : 'Pure Botanical Luxury'}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">{product.rating}</span>
            </div>
          </div>

          {/* Title */}
          <Link
            href={`/product/${product.slug}`}
            data-testid={`link-product-info-${product.id}`}
            className="block group-hover:text-[#4A1525] transition"
          >
            <h3 className="line-clamp-2 text-sm md:text-base font-bold text-foreground leading-snug">
              {displayName}
            </h3>
          </Link>
        </div>

        {/* Price & Action Button */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#EFE8DE] pt-2.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg md:text-xl font-bold font-mono-brand text-[#4A1525]">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through font-mono-brand opacity-60">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Circular Luxury Add Button */}
          <button
            type="button"
            aria-label={`${t('product.add_to_cart')} - ${displayName}`}
            data-testid={`button-add-${product.id}`}
            onClick={handleAddToCart}
            className={`flex size-10 md:size-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-all duration-300 active:scale-95 ${
              justAdded
                ? 'bg-[#4A1525] scale-105'
                : 'bg-[#4A1525] hover:bg-[#D48B88] hover:scale-105 shadow-[#4A1525]/20'
            }`}
          >
            {justAdded ? (
              <Check className="size-5 animate-in zoom-in" strokeWidth={2} />
            ) : (
              <Plus className="size-5 text-[#E8A598]" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}