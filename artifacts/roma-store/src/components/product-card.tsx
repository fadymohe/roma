import React, { useState } from 'react';
import { Link } from 'wouter';
import { Heart, ShoppingBag, Star, Check } from 'lucide-react';
import type { Product } from '@/lib/catalog-data';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';

export interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product }: ProductCardProps) {
  const { add } = useCart();
  const { isWishlisted, toggleWishlist } = useAuth();
  const { t, isAr, formatPrice } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!product || typeof product !== 'object' || !product.id) {
    return null;
  }

  const favorited = isWishlisted(product.id);
  const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
  const displayBadge = isAr ? product.badge : (product.badgeEn || product.badge);
  const displayCategory = isAr
    ? (product.category === 'hair-accessories' || product.category?.includes('شعر') ? 'إكسسوارات الشعر' :
       product.category === 'look-accessories' || product.category?.includes('إطلالة') || product.category?.includes('اطلالة') ? 'إكسسوارات الإطلالة' :
       product.category === 'jewelry' || product.category?.includes('مجوهرات') ? 'مجوهرات اليد والعنق' :
       product.category === 'makeup' || product.category?.includes('مكياج') ? 'المكياج والجمال' :
       product.category === 'perfumes' || product.category?.includes('عطر') ? 'العطور الفاخرة' :
       product.category === 'body-care' || product.category?.includes('جسم') || product.category?.includes('نعومة') || product.category?.includes('بشرة') ? 'العناية بالجسم والنعومة' :
       (product.category?.replace(/\s*\([^)]*\)/g, '').trim() || 'إكسسوارات وعناية'))
    : (product.categoryEn || product.category || 'Beauty & Accessories');

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    add(product, product.variants?.[0]);
    setTimeout(() => {
      setIsAdding(false);
    }, 1200);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      data-testid={`card-product-${product.id}`}
      className="group relative flex flex-col justify-between rounded-3xl border border-white/10 hover:border-[#D4A5A5]/60 bg-gradient-to-b from-[#151515] to-[#0F0F0F] p-3 sm:p-3.5 shadow-xl hover:shadow-2xl hover:shadow-[#D4A5A5]/10 transition-all duration-300 select-none overflow-hidden"
    >
      {/* Top Image Container: Perfectly proportioned container for laptop and mobile with pure white inner background */}
      <div className="relative h-48 sm:h-56 md:h-60 w-full overflow-hidden rounded-2xl bg-white flex items-center justify-center border border-zinc-200/80 group-hover:border-[#D4A5A5]/60 transition-colors p-3 sm:p-4">
        {/* Skeleton placeholder while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-zinc-100 animate-pulse rounded-2xl" />
        )}

        <Link
          href={`/product/${product.slug}`}
          data-testid={`link-product-${product.id}`}
          className="flex items-center justify-center h-full w-full relative z-0 focus:outline-hidden"
          aria-label={displayName}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={displayName}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.currentTarget;
                if (product.imageUrl?.startsWith('/uploads/') && !target.src.includes('raw.githubusercontent.com')) {
                  target.src = `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public${product.imageUrl}`;
                }
                setImageLoaded(true);
              }}
              className={`h-full w-full max-h-full max-w-full object-contain p-1 transition-transform duration-500 ease-out group-hover:scale-105 select-none ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="h-full w-full bg-white rounded-2xl flex items-center justify-center text-xs font-bold tracking-widest text-[#D4A5A5]">
              ROMA
            </div>
          )}
        </Link>

        {/* Top-Right corner Tag (Discount or Most Wanted) - Ultra High-Contrast Luxury Badge */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 pointer-events-none items-end">
          {discountPercent ? (
            <span
              data-testid={`tag-discount-${product.id}`}
              className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[11px] sm:text-xs px-2.5 py-0.5 shadow-md font-mono tracking-wider border border-white/20"
            >
              -{discountPercent}%
            </span>
          ) : displayBadge ? (
            <span
              data-testid={`tag-badge-${product.id}`}
              className="inline-flex items-center rounded-full bg-[#0A0A0A]/85 backdrop-blur-md text-[#D4A5A5] border border-[#D4A5A5]/40 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 shadow-md"
            >
              {displayBadge}
            </span>
          ) : null}
        </div>

        {/* Top-Left corner Wishlist Heart Button */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <button
            type="button"
            data-testid={`btn-wishlist-${product.id}`}
            onClick={handleFavoriteClick}
            aria-label={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
            className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-black/10 hover:border-[#D4A5A5] text-white transition-all hover:scale-110 active:scale-95 shadow-md group/btn"
          >
            <Heart
              className={`size-4 transition-all duration-300 ${
                favorited ? 'fill-[#D4A5A5] text-[#D4A5A5] scale-110 drop-shadow-[0_0_6px_rgba(212,165,165,0.6)]' : 'text-white/80 group-hover/btn:text-white'
              }`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      {/* Middle & Bottom: Content, Pricing, and Action */}
      <div className="flex flex-1 flex-col justify-between pt-3">
        {/* Category & Rating */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] mb-1">
            <span className="font-medium truncate max-w-[120px] tracking-wide text-zinc-400">{displayCategory}</span>
            <div className="flex items-center gap-1 font-mono">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-white text-[11px] font-bold">{product.rating}</span>
            </div>
          </div>

          {/* Product Title */}
          <Link
            href={`/product/${product.slug}`}
            className="block text-xs sm:text-sm font-bold text-white hover:text-[#D4A5A5] transition-colors line-clamp-2 leading-snug min-h-[2.5rem]"
          >
            {displayName}
          </Link>
        </div>

        {/* Pricing & Add to Bag CTA */}
        <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold font-mono text-[#D4A5A5] tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[11px] text-zinc-500 line-through font-mono -mt-0.5">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            data-testid={`btn-add-cart-${product.id}`}
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 shadow-md ${
              isAdding
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-white hover:bg-zinc-100 text-zinc-950 shadow-md hover:shadow-lg hover:shadow-white/10 border border-white/20'
            }`}
          >
            {isAdding ? (
              <>
                <Check className="size-3.5 text-white" />
                <span className="inline">{isAr ? 'تمت' : 'Added'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="size-3.5 text-zinc-950" strokeWidth={2.2} />
                <span className="inline text-zinc-950 font-bold">{t('product.add_to_cart')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}