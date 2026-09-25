import { Link } from 'wouter';
import { Heart, Plus, Star, Check } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@workspace/api-client-react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const { isWishlisted, toggleWishlist } = useAuth();
  const [justAdded, setJustAdded] = useState(false);

  if (!product || typeof product !== 'object' || !product.id) {
    return null;
  }

  const favorited = isWishlisted(product.id);

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

  // Generate friendly volume subtitle if not present
  const cat = typeof product.category === 'string' ? product.category : '';
  const volumeText = cat.includes('سيروم')
    ? '30 ml / 1.0 fl oz'
    : cat.includes('كريم') || cat.includes('أساس')
    ? '50 ml / 1.7 fl oz'
    : cat.includes('عطر')
    ? '100 ml / 3.4 fl oz'
    : 'تركيبة نقية فاخرة';

  return (
    <article
      data-testid={`card-product-${product.id}`}
      className="roma-card group relative flex flex-col justify-between rounded-[28px] border border-border/70 bg-card p-3.5 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Product Image Area with soft sage background */}
      <div className="relative aspect-[0.95] w-full overflow-hidden rounded-[22px] bg-[#E8EFEA] dark:bg-secondary/40 flex items-center justify-center p-3">
        <Link
          href={`/product/${product.slug}`}
          data-testid={`link-product-${product.id}`}
          className="block h-full w-full"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.nameAr}
              loading="lazy"
              className="roma-image h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-secondary via-muted to-accent/30 rounded-2xl" />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute right-3 top-3 flex flex-col gap-1 z-10 pointer-events-none">
          {product.badge && (
            <span
              data-testid={`badge-product-${product.id}`}
              className="rounded-full bg-[#527E5F] px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
            >
              {product.badge}
            </span>
          )}
          {discountPercent && (
            <span className="rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold text-background shadow-xs">
              خصم {discountPercent}%
            </span>
          )}
        </div>

        {/* Wishlist Button - Circular floating icon */}
        <button
          type="button"
          aria-pressed={favorited}
          aria-label={`إضافة ${product.nameAr} إلى المفضلة`}
          data-testid={`button-favorite-${product.id}`}
          onClick={handleFavoriteClick}
          className="absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground backdrop-blur-md shadow-xs transition-all hover:scale-110 active:scale-95 hover:bg-white"
        >
          <Heart
            className={`size-4 transition-colors ${
              favorited ? 'fill-primary text-primary' : 'text-foreground/70 hover:text-primary'
            }`}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* Product Information */}
      <div className="pt-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Subtitle / Volume */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>{volumeText}</span>
            <div className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">{product.rating}</span>
            </div>
          </div>

          {/* Title */}
          <Link
            href={`/product/${product.slug}`}
            data-testid={`link-product-info-${product.id}`}
            className="block group-hover:text-primary transition"
          >
            <h3 className="line-clamp-1 text-sm md:text-base font-bold text-foreground">
              {product.nameAr}
            </h3>
          </Link>
        </div>

        {/* Price & Signature Circular Plus Button */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg md:text-xl font-bold font-mono-brand text-foreground">
                {product.price}
              </span>
              <span className="text-xs font-bold text-muted-foreground">ج.م</span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through font-mono-brand mr-1.5 opacity-60">
                  {product.compareAtPrice} ج.م
                </span>
              )}
            </div>
          </div>

          {/* Iconic Circular Sage Green Add Button (From Reference Images) */}
          <button
            type="button"
            aria-label={`إضافة ${product.nameAr} إلى السلة`}
            data-testid={`button-add-${product.id}`}
            onClick={handleAddToCart}
            className={`flex size-10 md:size-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-all duration-300 active:scale-95 ${
              justAdded
                ? 'bg-[#3D694A] scale-105'
                : 'bg-[#76A080] hover:bg-[#638C6D] hover:scale-105 shadow-[#76A080]/30'
            }`}
          >
            {justAdded ? (
              <Check className="size-5 animate-in zoom-in" strokeWidth={2.4} />
            ) : (
              <Plus className="size-5" strokeWidth={2.4} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}