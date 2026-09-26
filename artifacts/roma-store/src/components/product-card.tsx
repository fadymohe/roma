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
      className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#141414] p-3 md:p-3.5 shadow-lg transition-all duration-300 hover:border-[#D4A5A5]/40 hover:shadow-2xl hover:shadow-[#D4A5A5]/5 select-none"
    >
      {/* Top Image Container: Strict 4:5 vertical portrait aspect ratio */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
        {/* Skeleton placeholder while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse rounded-2xl" />
        )}

        <Link
          href={`/product/${product.slug}`}
          data-testid={`link-product-${product.id}`}
          className="block h-full w-full relative z-0 focus:outline-hidden"
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
              className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="h-full w-full bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-xs text-[#D4A5A5]">
              ROMA
            </div>
          )}
        </Link>

        {/* Top-Right corner Tag (Discount or Most Wanted) */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 pointer-events-none items-end">
          {discountPercent ? (
            <span
              data-testid={`tag-discount-${product.id}`}
              className="inline-flex items-center rounded-full bg-[#D4A5A5] px-2.5 py-0.5 text-[10px] font-bold text-[#0A0A0A] shadow-md"
            >
              {isAr ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`}
            </span>
          ) : displayBadge ? (
            <span
              data-testid={`tag-badge-${product.id}`}
              className="inline-flex items-center rounded-full bg-[#D4A5A5] px-2.5 py-0.5 text-[10px] font-bold text-[#0A0A0A] shadow-md"
            >
              {displayBadge}
            </span>
          ) : null}
        </div>

        {/* Top-Left corner Wishlist Heart */}
        <div className="absolute top-2 left-2 z-10">
          <button
            type="button"
            data-testid={`btn-wishlist-${product.id}`}
            onClick={handleFavoriteClick}
            aria-label={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
            className="flex size-9 items-center justify-center rounded-full bg-[#0A0A0A]/60 backdrop-blur-md text-white transition hover:bg-[#0A0A0A] active:scale-90"
          >
            <Heart
              className={`size-4 transition-colors ${
                favorited ? 'fill-[#D4A5A5] text-[#D4A5A5]' : 'text-white/80 hover:text-white'
              }`}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>

      {/* Middle & Bottom: Content, Pricing, and Action */}
      <div className="flex flex-1 flex-col justify-between pt-3">
        {/* Category & Rating */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] mb-1">
            <span className="font-medium truncate max-w-[120px]">{displayCategory}</span>
            <div className="flex items-center gap-1 font-mono-brand">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-white text-[10px] font-semibold">{product.rating}</span>
            </div>
          </div>

          {/* Product Title */}
          <Link
            href={`/product/${product.slug}`}
            className="block text-xs md:text-sm font-bold text-white hover:text-[#D4A5A5] transition line-clamp-2 leading-snug"
          >
            {displayName}
          </Link>
        </div>

        {/* Pricing & Add to Bag CTA */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-extrabold font-mono-brand text-[#D4A5A5]">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[11px] text-[#A1A1AA] line-through font-mono-brand -mt-0.5">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            data-testid={`btn-add-cart-${product.id}`}
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 shadow-md ${
              isAdding
                ? 'bg-emerald-500 text-white'
                : 'bg-[#D4A5A5] text-[#0A0A0A] hover:bg-[#C89595]'
            }`}
          >
            {isAdding ? (
              <>
                <Check className="size-3.5" />
                <span className="hidden sm:inline">{isAr ? 'تمت' : 'Added'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="size-3.5 text-[#0A0A0A]" strokeWidth={1.75} />
                <span className="hidden sm:inline">{t('product.add_to_cart')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}