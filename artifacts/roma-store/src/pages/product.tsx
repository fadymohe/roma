import { ArrowRight, Minus, Plus, ShieldCheck, Star, Truck, Heart, Check, Sparkles, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useGetProduct } from '@workspace/api-client-react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { PRODUCTS } from '@/lib/catalog-data';
import { ProductCard } from '@/components/product-card';

export default function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const query = useGetProduct(slug);
  const { add } = useCart();
  const { isWishlisted, toggleWishlist } = useAuth();

  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Fallback to local catalog if API query fails or is loading
  const product = (query.data && typeof query.data === 'object' && 'id' in query.data && 'nameAr' in query.data)
    ? query.data
    : (PRODUCTS.find((p) => p.slug === slug) || PRODUCTS[0]);
  const variant = product.variants?.[selectedVariant];
  const favorited = isWishlisted(product.id);

  const addToBag = () => {
    for (let index = 0; index < quantity; index += 1) {
      add(product, variant);
    }
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.nameAr,
        text: product.descriptionAr,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط المنتج للمشاركة!');
    }
  };

  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id && (p.category === product.category || Math.random() > 0.4)).slice(0, 4);

  return (
    <div className="roma-container py-6 md:py-10" dir="rtl">
      {/* Top Header / Breadcrumb (Matching Image 2, 3, 4) */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/shop"
          data-testid="link-back-shop"
          className="flex size-10 items-center justify-center rounded-full border border-[#DEE6E0] bg-white text-foreground/80 shadow-xs hover:border-[#76A080] hover:text-[#527E5F] transition"
          aria-label="العودة للمتجر"
        >
          <ArrowRight className="size-4.5" />
        </Link>
        <div className="text-center">
          <span className="font-display text-sm md:text-base font-bold text-foreground">
            تفاصيل المنتج · Product detail
          </span>
        </div>
        <button
          type="button"
          aria-pressed={favorited}
          onClick={() => toggleWishlist(product.id)}
          className="flex size-10 items-center justify-center rounded-full border border-[#DEE6E0] bg-white text-foreground shadow-xs hover:border-[#76A080] transition"
          aria-label="المفضلة"
        >
          <Heart
            className={`size-4.5 ${favorited ? 'fill-[#527E5F] text-[#527E5F]' : 'text-foreground/80'}`}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* Product Details Section */}
      <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:gap-14 items-start">
        {/* Visual Gallery / Hero Image Card */}
        <div className="relative">
          <div className="relative aspect-[0.92] overflow-hidden rounded-[32px] border border-[#DEE6E0] bg-[#E8EFEA] dark:bg-secondary/40 p-6 flex items-center justify-center shadow-xs">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.nameAr}
                className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-secondary via-muted to-accent/20 rounded-2xl" />
            )}

            {product.badge && (
              <span className="absolute right-5 top-5 rounded-full bg-[#527E5F] px-3.5 py-1 text-xs font-bold text-white shadow-xs">
                {product.badge}
              </span>
            )}
          </div>
        </div>

        {/* Info & Options (Matching Images 2, 4, 5) */}
        <div className="flex flex-col justify-center space-y-5">
          <div>
            <span className="font-mono-brand text-xs font-bold tracking-widest text-[#527E5F]">
              {product.category}
            </span>
            <h1
              data-testid="text-product-name"
              className="mt-1 font-display text-2xl md:text-4xl font-extrabold text-foreground leading-snug"
            >
              {product.nameAr}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              50 ml / 1.7 fl oz · تركيبة طبيعية خفيفة وعميقة الترطيب
            </p>

            {/* Ratings */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground">{product.rating}</span>
              <span className="text-xs text-muted-foreground">({product.reviewCount} تقييم موثق)</span>
            </div>
          </div>

          {/* Official Store Badge (From Image 5) */}
          <div className="flex items-center justify-between rounded-[22px] border border-[#DEE6E0] bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#E8EFEA] text-[#4E7A5A] flex items-center justify-center font-bold text-lg">
                🌿
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs md:text-sm font-bold text-foreground">Glow Nature Store</h4>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.2 rounded-full">✓ موثق</span>
                </div>
                <p className="text-[11px] text-muted-foreground">المتجر الرسمي المعتمد</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full bg-black px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800"
            >
              متابعة
            </button>
          </div>

          {/* Description */}
          <p
            data-testid="text-product-description"
            className="text-xs md:text-sm leading-relaxed text-muted-foreground"
          >
            {product.descriptionAr}
          </p>

          {/* Size Selection Capsules (From Image 2 & 5) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              الحجم المتوفر (Select size):
            </label>
            <div className="flex items-center gap-2.5">
              {[
                { size: '30ml', price: product.price - 20 },
                { size: '50ml', price: product.price },
                { size: '100ml', price: product.price + 50 },
              ].map((item, idx) => (
                <button
                  type="button"
                  key={item.size}
                  onClick={() => setSelectedVariant(idx)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                    selectedVariant === idx
                      ? 'bg-[#76A080] text-white shadow-md shadow-[#76A080]/30'
                      : 'border border-[#DEE6E0] bg-white text-muted-foreground hover:border-[#76A080] hover:text-foreground'
                  }`}
                >
                  <span>{item.size}</span>
                  <span className="mr-1.5 opacity-80">({item.price} ج.م)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Capsule, Total Price & Add to Cart (Directly from Image 3, 4, 5) */}
          <div className="rounded-[28px] border border-[#DEE6E0] bg-[#FAFBF9] p-4 md:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              {/* Total Price */}
              <div>
                <span className="text-xs text-muted-foreground block">السعر الإجمالي (Total price):</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl md:text-3xl font-extrabold font-mono-brand text-foreground">
                    {product.price * quantity}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">ج.م</span>
                </div>
              </div>

              {/* Capsule Quantity Stepper (Image 3 & 4) */}
              <div className="flex items-center rounded-full border border-[#DEE6E0] bg-white px-2 py-1 shadow-xs">
                <button
                  type="button"
                  aria-label="تقليل الكمية"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-90"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center font-mono-brand text-xs md:text-sm font-bold text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="زيادة الكمية"
                  onClick={() => setQuantity(quantity + 1)}
                  className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-90"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Large Rounded Sage Green Add to Cart Pill (Image 2, 4, 5) */}
            <button
              type="button"
              data-testid="button-add-to-cart"
              onClick={addToBag}
              className={`w-full flex items-center justify-center gap-2 rounded-full py-4 px-6 text-sm font-bold text-white shadow-md transition-all duration-300 active:scale-95 ${
                addedNotice
                  ? 'bg-[#356141] shadow-lg'
                  : 'bg-[#527E5F] hover:bg-[#456C50] shadow-[#527E5F]/25'
              }`}
            >
              {addedNotice ? (
                <>
                  <Check className="size-5 animate-in zoom-in" strokeWidth={2.5} />
                  <span>تمت الإضافة للسلة بنجاح!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="size-5" />
                  <span>أضيفي إلى السلة · Add to Cart</span>
                </>
              )}
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 border-t border-[#DEE6E0] pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-[#527E5F] shrink-0" />
              <span>توصيل سريع خلال 24–48 ساعة</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#527E5F] shrink-0" />
              <span>تركيبة نباتية مصرحة 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-24 border-t border-border/80 pt-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <span className="font-mono-brand text-xs font-bold text-primary tracking-widest">
                مقترحات مختارة لكِ
              </span>
              <h3 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">
                منتجات مقترحة لكِ
              </h3>
            </div>
            <Link href="/shop" className="text-xs font-bold text-primary hover:underline">
              عرض المزيد
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}