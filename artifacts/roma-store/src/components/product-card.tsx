'use client';

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
    ? (product.category === 'face' ? 'مستحضرات الوجه' :
       product.category === 'serum' ? 'سيرومات النضارة' :
       product.category === 'skincare' ? 'العناية بالبشرة' :
       product.category === 'moisturizers' ? 'مرطبات فاخرة' :
       product.category === 'lips' ? 'أحمر شفاه' :
       product.category === 'accessories' ? 'إكسسوارات' : 'عناية وجمال')
    : (product.categoryEn || product.category || 'Beauty & Cosmetics');

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
      {/* Top Image Container: Balanced 4:5 vertical portrait aspect ratio with luxury border & clean padding */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#161616] flex items-center justify-center border border-white/10 group-hover:border-[#D4A5A5]/40 transition-colors shadow-inner p-3 sm:p-4">
        {/* Skeleton placeholder while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse rounded-2xl" />
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
              width={320}
              height={400}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.currentTarget;
                if (product.imageUrl?.startsWith('/uploads/') && !target.src.includes('raw.githubusercontent.com')) {
                  target.src = `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public${product.imageUrl}`;
                }
                setImageLoaded(true);
              }}
              className={`max-h-full max-w-full h-auto w-auto object-contain transition-transform duration-500 ease-out group-hover:scale-105 drop-shadow-md select-none ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="h-full w-full bg-[#181818] rounded-2xl flex items-center justify-center text-xs font-bold tracking-widest text-[#D4A5A5]">
              ROMA
            </div>
          )}
        </Link>

        {/* Top-Right corner Tag (Discount or Most Wanted) - Ultra High-Contrast Luxury Badge */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 pointer-events-none items-end">
          {discountPercent ? (
            <span
              data-testid={`tag-discount-${product.id}`}
              className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-[#D4A5A5] to-[#B37070] text-[#0A0A0A] font-extrabold text-[11px] sm:text-xs px-2.5 py-0.5 shadow-lg shadow-black/50 font-mono tracking-wider border border-white/20"
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
            className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-[#0A0A0A]/75 backdrop-blur-md border border-white/15 hover:border-[#D4A5A5] text-white transition-all hover:scale-110 active:scale-95 shadow-md group/btn"
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
                : 'bg-gradient-to-r from-[#D4A5A5] to-[#C89595] text-[#0A0A0A] hover:brightness-110 shadow-[#D4A5A5]/10'
            }`}
          >
            {isAdding ? (
              <>
                <Check className="size-3.5" />
                <span className="hidden sm:inline">{isAr ? 'تمت' : 'Added'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="size-3.5 text-[#0A0A0A]" strokeWidth={2} />
                <span className="hidden sm:inline">{t('product.add_to_cart')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}