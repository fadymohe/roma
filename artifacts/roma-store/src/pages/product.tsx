import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Truck,
  Heart,
  Check,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Zap,
  Award,
  Leaf,
  Droplets,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { DEFAULT_PRODUCTS, useLiveProducts, type Product } from '@/lib/catalog-data';
import { ProductCard } from '@/components/product-card';

export default function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const liveProducts = useLiveProducts();
  const { add } = useCart();
  const { isWishlisted, toggleWishlist } = useAuth();
  const { t, isAr, formatPrice, dir } = useLanguage();

  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'howTo' | 'reviews'>('desc');
  const touchStartX = useRef<number | null>(null);

  // Match product from live dynamic list or default products
  const product: Product =
    liveProducts.find((p) => p.slug === slug) ||
    DEFAULT_PRODUCTS.find((p) => p.slug === slug) ||
    liveProducts[0] ||
    DEFAULT_PRODUCTS[0];

  const variant = product.variants?.[selectedVariant] || product.variants?.[0];
  const favorited = isWishlisted(product.id);

  const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
  const displayDescription = isAr ? product.descriptionAr : (product.descriptionEn || product.descriptionAr);
  const displayIngredients = isAr ? product.ingredientsAr : (product.ingredientsEn || product.ingredientsAr);
  const displayHowToUse = isAr ? product.howToUseAr : (product.howToUseEn || product.howToUseAr);
  const displayBadge = isAr ? product.badge : (product.badgeEn || product.badge);

  const galleryImages = [
    product.imageUrl,
    ...(product.additionalImages || []),
  ].filter(Boolean);

  const addToBag = () => {
    for (let index = 0; index < quantity; index += 1) {
      add(product, variant);
    }
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  const buyNowDirect = () => {
    add(product, variant);
    setLocation('/cart');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: displayName,
        text: displayDescription,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(isAr ? 'تم نسخ رابط المنتج للمشاركة!' : 'Product link copied to clipboard!');
    }
  };

  // Touch swipe support for Amazon-style carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next image
        setSelectedImage((prev) => (prev + 1) % galleryImages.length);
      } else {
        // swipe right -> prev image
        setSelectedImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
    }
    touchStartX.current = null;
  };

  const relatedProducts = liveProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const currentStock = variant?.stock ?? product.stock ?? 12;

  return (
    <div className="roma-container py-6 md:py-12 text-[#F9FAFB] pb-32" dir={dir}>
      {/* Top Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/shop"
          data-testid="link-back-shop"
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:border-[#D4A5A5] hover:text-white transition"
          aria-label="Back to Shop"
        >
          <ArrowRight className={`size-4.5 ${isAr ? '' : 'rotate-180'}`} />
        </Link>

        <div className="text-center">
          <span className="font-display text-xs md:text-sm font-bold text-[#A1A1AA] uppercase tracking-widest">
            ROMA ATELIER · {isAr ? 'مستحضرات وإكسسوارات فاخرة' : 'Haute Cosmetics'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:border-[#D4A5A5] hover:text-white transition"
          >
            <Share2 className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-pressed={favorited}
            onClick={() => toggleWishlist(product.id)}
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-white hover:border-[#D4A5A5] transition"
            aria-label="Wishlist"
          >
            <Heart
              className={`size-4 ${favorited ? 'fill-[#D4A5A5] text-[#D4A5A5]' : 'text-[#A1A1AA]'}`}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="grid gap-10 md:grid-cols-2 md:gap-14 items-start">
        {/* Left Column: Amazon-Style Touch-Swipeable Gallery */}
        <div className="space-y-4">
          <div
            className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-[#141414] p-6 flex items-center justify-center shadow-xl group select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={galleryImages[selectedImage] || product.imageUrl}
              alt={displayName}
              onError={(e) => {
                const target = e.currentTarget;
                if (product.imageUrl?.startsWith('/uploads/') && !target.src.includes('raw.githubusercontent.com')) {
                  target.src = `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public${product.imageUrl}`;
                }
              }}
              className="h-full w-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
            />

            {/* Badge */}
            {displayBadge && (
              <span className="absolute top-5 right-5 rounded-full bg-[#D4A5A5] px-3.5 py-1 text-xs font-bold text-[#0A0A0A] shadow-md">
                {displayBadge}
              </span>
            )}

            {/* Free Shipping Tag */}
            <div className="absolute bottom-5 left-5 rounded-full bg-[#0A0A0A]/85 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-[#D4A5A5] shadow-md flex items-center gap-1.5 border border-white/10">
              <Truck className="size-3.5 text-[#D4A5A5]" />
              <span>{t('pdp.free_shipping_hint')}</span>
            </div>

            {/* Swipe hint dots for mobile */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#0A0A0A]/60 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
                {galleryImages.map((_, i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full transition-all ${
                      selectedImage === i ? 'bg-[#D4A5A5] w-3' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative size-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all p-0.5 bg-[#141414] ${
                    selectedImage === idx
                      ? 'border-[#D4A5A5] shadow-lg scale-105'
                      : 'border-white/10 hover:border-white/30 opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Value Badges under Image */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#141414] border border-white/5 shadow-2xs">
              <Leaf className="size-4 text-[#D4A5A5] mb-1" />
              <span className="text-[10px] font-bold text-white">{isAr ? '١٠٠٪ طبيعي' : '100% Organic'}</span>
              <span className="text-[9px] text-[#A1A1AA]">{isAr ? 'خالٍ من البارابين' : 'Toxin-Free'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#141414] border border-white/5 shadow-2xs">
              <Award className="size-4 text-[#D4A5A5] mb-1" />
              <span className="text-[10px] font-bold text-white">{isAr ? 'مسجل بالصحة' : 'MOH Registered'}</span>
              <span className="text-[9px] text-[#A1A1AA]">{isAr ? 'ترخيص جودة مصري' : 'Gov Certified'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#141414] border border-white/5 shadow-2xs">
              <Droplets className="size-4 text-[#D4A5A5] mb-1" />
              <span className="text-[10px] font-bold text-white">{isAr ? 'مختبر جلدياً' : 'Derm Tested'}</span>
              <span className="text-[9px] text-[#A1A1AA]">{isAr ? 'آمن للبشرة' : 'Sensitive Safe'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#141414] border border-white/5 shadow-2xs">
              <Truck className="size-4 text-[#D4A5A5] mb-1" />
              <span className="text-[10px] font-bold text-white">{isAr ? 'شحن ٢٤-٤٨ ساعة' : '24-48h Delivery'}</span>
              <span className="text-[9px] text-[#A1A1AA]">{isAr ? 'دفع عند الاستلام' : 'Cash on Delivery'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Pricing, Swatches & Purchase Block */}
        <div className="space-y-6">
          <div>
            <span className="font-mono-brand text-xs font-bold tracking-widest text-[#D4A5A5] uppercase">
              {product.categoryEn || product.category}
            </span>
            <h1
              data-testid="text-product-name"
              className="mt-1 font-display text-2xl md:text-4xl font-extrabold text-white leading-snug"
            >
              {displayName}
            </h1>

            {/* Ratings & Stock Badge */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2.5 py-1 rounded-full border border-white/10">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-white">{product.rating}</span>
                <span className="text-xs text-[#A1A1AA]">({product.reviewCount} {isAr ? 'تقييم موثق' : 'reviews'})</span>
              </div>

              {/* Dynamic Stock Indicator */}
              {currentStock <= 5 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full animate-pulse">
                  <AlertCircle className="size-3.5" />
                  {isAr ? `متبقي ${currentStock} قطع فقط في المخزن!` : `Only ${currentStock} units left in stock!`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
                  <CheckCircle2 className="size-3.5" />
                  {isAr ? `متوفر في المخزون (${currentStock} قطعة جاهزة للشحن)` : `In Stock (${currentStock} units)`}
                </span>
              )}
            </div>

            {/* Price Row */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-extrabold font-mono-brand text-[#D4A5A5]">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-base text-[#A1A1AA] line-through font-mono-brand opacity-60">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              {product.compareAtPrice && (
                <span className="rounded-full bg-[#D4A5A5] px-2.5 py-0.5 text-xs font-bold text-[#0A0A0A] shadow-xs">
                  {isAr ? `وفرتي ${product.compareAtPrice - product.price} ج.م` : `Save ${product.compareAtPrice - product.price} EGP`}
                </span>
              )}
            </div>
          </div>

          {/* Shade & Variant Swatches */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#141414] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">
                  {t('pdp.select_shade')}
                </span>
                <span className="font-bold text-[#D4A5A5]">
                  {isAr ? variant?.nameAr : (variant?.nameEn || variant?.nameAr)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {product.variants.map((v, idx) => (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setSelectedVariant(idx)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs ${
                      selectedVariant === idx
                        ? 'border-[#D4A5A5] bg-[#D4A5A5]/15 text-[#D4A5A5] ring-2 ring-[#D4A5A5]/20'
                        : 'border-white/10 bg-[#1A1A1A] text-[#A1A1AA] hover:border-white/20'
                    }`}
                  >
                    <span
                      className="size-4 rounded-full border border-black/20 shrink-0 shadow-xs"
                      style={{ backgroundColor: v.hex }}
                    />
                    <span>{isAr ? v.nameAr : (v.nameEn || v.nameAr)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Purchase Action Block */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Quantity Stepper */}
              <div className="flex items-center rounded-2xl border border-white/10 bg-[#141414] p-1 shadow-xs">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="size-9 rounded-xl flex items-center justify-center text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center font-mono-brand text-sm font-bold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="size-9 rounded-xl flex items-center justify-center text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                data-testid="button-add-to-cart"
                onClick={addToBag}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#D4A5A5] hover:bg-[#C89595] py-3.5 px-6 text-sm font-bold text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20 transition active:scale-[0.99]"
              >
                <ShoppingBag className="size-4 text-[#0A0A0A]" />
                <span>
                  {addedNotice
                    ? isAr
                      ? '✓ تمت الإضافة إلى الحقيبة بنجاح!'
                      : '✓ Added to Bag!'
                    : t('product.add_to_cart')}
                </span>
              </button>
            </div>

            {/* Buy Now Direct Button */}
            <button
              type="button"
              data-testid="button-buy-now"
              onClick={buyNowDirect}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#1A1A1A] hover:bg-white/5 py-3.5 px-6 text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
            >
              <Zap className="size-4 text-[#D4A5A5]" />
              <span>{t('product.buy_now')}</span>
            </button>
          </div>

          {/* Reassurance Features */}
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 space-y-2 text-xs text-[#A1A1AA]">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck className="size-4 text-[#D4A5A5]" />
              <span>{isAr ? 'ضمان استبدال واسترجاع لمدة ١٤ يوماً' : '14-Day Hassle-Free Returns & Exchange'}</span>
            </div>
            <div className="flex items-center gap-2 text-white font-medium">
              <Truck className="size-4 text-[#D4A5A5]" />
              <span>{isAr ? 'معاينة المنتج قبل الدفع للمندوب متاحة' : 'Inspect Product Upon Courier Delivery'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description, Ingredients, Ritual & Reviews */}
      <div className="mt-14 border-t border-white/10 pt-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition ${
              activeTab === 'desc'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-xs'
                : 'text-[#A1A1AA] hover:text-white bg-[#141414]'
            }`}
          >
            {t('pdp.tab_description')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition ${
              activeTab === 'ingredients'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-xs'
                : 'text-[#A1A1AA] hover:text-white bg-[#141414]'
            }`}
          >
            {t('pdp.tab_ingredients')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('howTo')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition ${
              activeTab === 'howTo'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-xs'
                : 'text-[#A1A1AA] hover:text-white bg-[#141414]'
            }`}
          >
            {t('pdp.tab_how_to_use')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition ${
              activeTab === 'reviews'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-xs'
                : 'text-[#A1A1AA] hover:text-white bg-[#141414]'
            }`}
          >
            {t('pdp.tab_reviews')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTab === 'desc' && (
            <div className="prose prose-invert prose-sm max-w-none text-[#A1A1AA] leading-relaxed space-y-4">
              <p className="text-sm md:text-base leading-relaxed text-white/90">{displayDescription}</p>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4 text-sm text-[#A1A1AA]">
              <h3 className="font-display font-bold text-base text-white">
                {isAr ? 'تركيبة غنية بخلاصات نقية طبيعية' : 'Pure Botanical Actives'}
              </h3>
              <p className="leading-relaxed bg-[#141414] p-4 rounded-2xl border border-white/10 text-white/90">
                {displayIngredients || (isAr ? 'تركيبة نباتية خالية من البارابين والزيوت المعدنية الضارة.' : 'Botanical formula free from parabens and mineral oils.')}
              </p>
            </div>
          )}

          {activeTab === 'howTo' && (
            <div className="space-y-4 text-sm text-[#A1A1AA]">
              <h3 className="font-display font-bold text-base text-white">
                {isAr ? 'طقوس الاستخدام المثالية لنتائج مبهرة' : 'The Ideal Application Ritual'}
              </h3>
              <p className="leading-relaxed bg-[#141414] p-4 rounded-2xl border border-white/10 text-white/90">
                {displayHowToUse || (isAr ? 'يُستخدم يومياً صباحاً ومساءً على بشرة نظيفة للحصول على أقصى ترطيب ونضارة.' : 'Use daily morning and evening on clean skin for optimal radiance.')}
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    {isAr ? 'تجارب وآراء العميلات' : 'Verified Client Reviews'}
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">{product.rating} من 5 نجوم · بناءً على {product.reviewCount} تقييم</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-white/10 bg-[#141414] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">هدى سليم</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 font-bold px-2 py-0.5 rounded-full border border-emerald-800/40">✓ مشترية موثقة</span>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {isAr
                      ? 'المنتج فاق توقعاتي بكتير! التغليف لوحده تحفة فنية والتركيبة فرقت في بشرتي من أول استخدامين.'
                      : 'Exceeded all expectations! Breathtaking packaging and truly transformative texture from the first uses.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-[#141414] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">داليا الألفي</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 font-bold px-2 py-0.5 rounded-full border border-emerald-800/40">✓ مشترية موثقة</span>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {isAr
                      ? 'شحن سريع جداً وصلني تاني يوم في المعادي، وأهم حاجة إني قدرت أعاين الأوردر قبل ما أدفع للمندوب.'
                      : 'Next-day delivery to Maadi! Loved the option to inspect the parcel before paying the courier.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-white/10 pt-14">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <span className="font-mono-brand text-xs font-bold text-[#D4A5A5] tracking-widest uppercase">
                {isAr ? 'مختارات ملكية لكِ' : 'Curated For You'}
              </span>
              <h3 className="mt-1 font-display text-2xl font-bold text-white md:text-3xl">
                {isAr ? 'منتجات مقترحة تتناغم مع اختياركِ' : 'Complementary Beauty Pairings'}
              </h3>
            </div>
            <Link href="/shop" className="text-xs font-bold text-[#D4A5A5] hover:underline">
              {isAr ? 'عرض الكل' : 'View All'}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AMAZON-STYLE STICKY MOBILE ADD-TO-CART BAR WITH INSTANT FEEDBACK          */}
      {/* Sits right above or on bottom on mobile viewport                          */}
      {/* ========================================================================= */}
      <div className="fixed bottom-14 left-0 right-0 z-40 md:hidden bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 p-3 px-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#A1A1AA] block">{t('cart.total')}</span>
            <span className="text-base font-extrabold font-mono-brand text-[#D4A5A5]">
              {formatPrice(product.price * quantity)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addToBag}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                addedNotice
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#D4A5A5] text-[#0A0A0A] hover:bg-[#C89595]'
              }`}
            >
              {addedNotice ? '✓ تمت الإضافة' : t('product.add_to_cart')}
            </button>
            <button
              type="button"
              onClick={buyNowDirect}
              className="px-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-white/15 text-white text-xs font-bold hover:bg-white/10 transition"
            >
              {t('product.buy_now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}