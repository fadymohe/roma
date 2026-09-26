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
      className="group relative flex flex-col justify-between rounded-2xl border border-[#ECE3E1] bg-white p-3 shadow-xs transition-all duration-300 hover:border-[#8A4F58]/50 hover:shadow-lg hover:shadow-[#5A1827]/5 select-none"
    >
      {/* Top Image Container: Strict 4:5 vertical portrait aspect ratio */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#FAF8F5] flex items-center justify-center">
        {/* Skeleton placeholder while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#ECE3E1]/60 animate-pulse rounded-xl" />
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
              className={`h-full w-full object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#F5EBEB] to-[#ECE3E1] rounded-xl flex items-center justify-center text-xs text-[#8A4F58]">
              ROMA
            </div>
          )}
        </Link>

        {/* Top-Right corner Tag (Discount or Most Wanted) */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 pointer-events-none items-end">
          {discountPercent ? (
            <span
              data-testid={`tag-discount-${product.id}`}
              className="inline-flex items-center rounded-md bg-[#D92D20] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
            >
              {isAr ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`}
            </span>
          ) : displayBadge ? (
            <span
              data-testid={`tag-badge-${product.id}`}
              className="inline-flex items-center rounded-md bg-[#5A1827] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
            >
              {displayBadge}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-[#5A1827] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              {isAr ? 'الأكثر طلباً' : 'Bestseller'}
            </span>
          )}
        </div>

        {/* Top-Left corner Wishlist Heart - Min 48x48px Touch Target */}
        <div className="absolute top-1 left-1 z-10">
          <button
            type="button"
            aria-pressed={favorited}
            aria-label={favorited ? (isAr ? 'إزالة من المفضلة' : 'Remove from wishlist') : (isAr ? 'إضافة إلى المفضلة' : 'Add to wishlist')}
            data-testid={`button-favorite-${product.id}`}
            onClick={handleFavoriteClick}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full text-[#1F1618] active:scale-90 transition-transform focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#5A1827]"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-xs hover:bg-white transition-colors">
              <Heart
                className={`size-4.5 transition-colors ${
                  favorited
                    ? 'fill-[#E06D53] text-[#E06D53]'
                    : 'text-[#6B5E62] hover:text-[#5A1827]'
                }`}
                strokeWidth={1.75}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Details Below Image */}
      <div className="pt-2.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Row 1: Brand / Category (12px, Muted #6B5E62) & Rating */}
          <div className="flex items-center justify-between gap-1 text-[12px] text-[#6B5E62] mb-1">
            <span className="truncate font-medium text-[#8A4F58]">
              {displayCategory}
            </span>

            {/* Star Rating Score: e.g. 4.9 ★ (84) */}
            <div className="flex items-center gap-1 shrink-0 text-[11px] font-semibold text-[#1F1618]">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span>{product.rating || '4.9'}</span>
              <span className="text-[#9A8E91] font-normal text-[10px]">
                ({product.reviewsCount || 84})
              </span>
            </div>
          </div>

          {/* Row 2: Product Title (15px, Font Weight 600, Max 2 lines truncation) */}
          <Link
            href={`/product/${product.slug}`}
            data-testid={`link-product-title-${product.id}`}
            className="block text-[#1F1618] hover:text-[#5A1827] transition-colors focus:outline-hidden"
          >
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-[1.35] min-h-[40px]">
              {displayName}
            </h3>
          </Link>
        </div>

        {/* Row 3: Price Row */}
        <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-[#ECE3E1]/70 pt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {/* New Price: Bold Terracotta #E06D53, 17px, font-weight 700 */}
            <span className="text-[17px] font-bold text-[#E06D53] tracking-tight">
              {product.price}{' '}
              <span className="text-[12px] font-medium text-[#E06D53]">
                {isAr ? 'ج.م' : 'EGP'}
              </span>
            </span>

            {/* Old Price: 13px, font-weight 400, #9A8E91, strikethrough */}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[13px] font-normal text-[#9A8E91] line-through">
                {product.compareAtPrice} {isAr ? 'ج.م' : 'EGP'}
              </span>
            )}
          </div>

          {/* In stock badge / stock count */}
          {product.stock && product.stock <= 5 ? (
            <span className="text-[10px] font-bold text-[#D92D20] shrink-0">
              {isAr ? `متبقي ${product.stock} فقط` : `Only ${product.stock} left`}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-[#1B6B4A] shrink-0">
              {isAr ? 'متوفر' : 'In Stock'}
            </span>
          )}
        </div>

        {/* Row 4: Primary Action - Full-Width Quick Add Button (h: 44px, rounded-lg: 8px) */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`${isAr ? 'أضف للسلة' : 'Add to bag'} - ${displayName}`}
            data-testid={`button-quick-add-${product.id}`}
            className={`w-full h-[44px] rounded-[8px] font-semibold text-[13px] sm:text-[14px] flex items-center justify-center gap-2 shadow-xs transition-all duration-200 active:scale-[0.98] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#5A1827] ${
              isAdding
                ? 'bg-[#1B6B4A] text-white'
                : 'bg-[#E06D53] hover:bg-[#C8573E] text-white shadow-[#E06D53]/25 hover:shadow-md'
            }`}
          >
            {isAdding ? (
              <>
                <Check className="size-4 animate-in zoom-in-50" strokeWidth={2.5} />
                <span>{isAr ? 'تمت الإضافة بنجاح ✓' : 'Added to Bag ✓'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" strokeWidth={1.75} />
                <span>{isAr ? 'أضف للسلة' : 'Add to Bag'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Skeleton State for ProductCard (animate-pulse placeholder boxes before media loading)
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#ECE3E1] bg-white p-3 shadow-xs animate-pulse">
      {/* 4:5 image skeleton */}
      <div className="aspect-[4/5] w-full rounded-xl bg-[#ECE3E1]/70" />

      <div className="pt-2.5 space-y-2">
        {/* Category & rating skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-[#ECE3E1] rounded-md" />
          <div className="h-3 w-10 bg-[#ECE3E1] rounded-md" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-1.5 min-h-[40px]">
          <div className="h-3.5 w-full bg-[#ECE3E1] rounded-md" />
          <div className="h-3.5 w-3/4 bg-[#ECE3E1] rounded-md" />
        </div>

        {/* Price row skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-[#ECE3E1]/60">
          <div className="h-4 w-20 bg-[#ECE3E1] rounded-md" />
          <div className="h-3 w-12 bg-[#ECE3E1] rounded-md" />
        </div>

        {/* Button skeleton */}
        <div className="h-[44px] w-full bg-[#ECE3E1] rounded-[8px] mt-2" />
      </div>
    </div>
  );
}

export default ProductCard;