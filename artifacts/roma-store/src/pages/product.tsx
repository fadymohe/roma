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
} from 'lucide-react';
import { useState } from 'react';
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
    setTimeout(() => setAddedNotice(false), 2000);
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

  const relatedProducts = liveProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const currentStock = variant?.stock ?? product.stock ?? 8;

  return (
    <div className="roma-container py-6 md:py-12" dir={dir}>
      {/* Top Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/shop"
          data-testid="link-back-shop"
          className="flex size-10 items-center justify-center rounded-full border border-[#EFE8DE] bg-white text-foreground/80 shadow-xs hover:border-[#D48B88] hover:text-[#4A1525] transition"
          aria-label="Back to Shop"
        >
          <ArrowRight className={`size-4.5 ${isAr ? '' : 'rotate-180'}`} />
        </Link>

        <div className="text-center">
          <span className="font-display text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
            ROMA ATELIER · {isAr ? 'تفاصيل المستحضر الفاخر' : 'Luxury Haute Product'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="flex size-10 items-center justify-center rounded-full border border-[#EFE8DE] bg-white text-foreground/80 shadow-xs hover:border-[#D48B88] hover:text-[#4A1525] transition"
          >
            <Share2 className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-pressed={favorited}
            onClick={() => toggleWishlist(product.id)}
            className="flex size-10 items-center justify-center rounded-full border border-[#EFE8DE] bg-white text-foreground shadow-xs hover:border-[#D48B88] transition"
            aria-label="Wishlist"
          >
            <Heart
              className={`size-4 ${favorited ? 'fill-[#D48B88] text-[#D48B88]' : 'text-foreground/80'}`}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="grid gap-10 md:grid-cols-2 md:gap-14 items-start">
        {/* Left Column: Swipeable Gallery with Zoom & Thumbnails */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-[32px] border border-[#EFE8DE] bg-[#F8EBEA]/80 p-6 flex items-center justify-center shadow-xs group">
            <img
              src={galleryImages[selectedImage] || product.imageUrl}
              alt={displayName}
              onError={(e) => {
                const target = e.currentTarget;
                if (product.imageUrl?.startsWith('/uploads/') && !target.src.includes('raw.githubusercontent.com')) {
                  target.src = `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public${product.imageUrl}`;
                }
              }}
              className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
            />

            {/* Badge */}
            {displayBadge && (
              <span className="absolute top-5 right-5 rounded-full bg-[#4A1525] px-3.5 py-1 text-xs font-bold text-white shadow-xs">
                {displayBadge}
              </span>
            )}

            {/* Free Shipping Tag */}
            <div className="absolute bottom-5 left-5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-[#4A1525] shadow-xs flex items-center gap-1.5 border border-[#EFE8DE]">
              <Truck className="size-3.5 text-[#D48B88]" />
              <span>{t('pdp.free_shipping_hint')}</span>
            </div>
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative size-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-[#F8EBEA]/60 ${
                    selectedImage === idx
                      ? 'border-[#4A1525] shadow-sm scale-105'
                      : 'border-[#EFE8DE] hover:border-[#D48B88] opacity-75'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Value Badges under Image */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-white border border-[#EFE8DE] shadow-2xs">
              <Leaf className="size-4 text-[#4A1525] mb-1" />
              <span className="text-[10px] font-bold text-foreground">{isAr ? '١٠٠٪ طبيعي' : '100% Organic'}</span>
              <span className="text-[9px] text-muted-foreground">{isAr ? 'خالٍ من البارابين' : 'Toxin-Free'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-white border border-[#EFE8DE] shadow-2xs">
              <Award className="size-4 text-[#4A1525] mb-1" />
              <span className="text-[10px] font-bold text-foreground">{isAr ? 'مسجل بالصحة' : 'MOH Registered'}</span>
              <span className="text-[9px] text-muted-foreground">{isAr ? 'ترخيص جودة مصري' : 'Gov Certified'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-white border border-[#EFE8DE] shadow-2xs">
              <Droplets className="size-4 text-[#4A1525] mb-1" />
              <span className="text-[10px] font-bold text-foreground">{isAr ? 'مختبر جلدياً' : 'Derm Tested'}</span>
              <span className="text-[9px] text-muted-foreground">{isAr ? 'آمن للبشرة' : 'Sensitive Safe'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-white border border-[#EFE8DE] shadow-2xs">
              <Truck className="size-4 text-[#4A1525] mb-1" />
              <span className="text-[10px] font-bold text-foreground">{isAr ? 'شحن ٢٤-٤٨ ساعة' : '24-48h Delivery'}</span>
              <span className="text-[9px] text-muted-foreground">{isAr ? 'دفع عند الاستلام' : 'Cash on Delivery'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Pricing, Swatches & Purchase Block */}
        <div className="space-y-6">
          <div>
            <span className="font-mono-brand text-xs font-bold tracking-widest text-[#D48B88] uppercase">
              {product.categoryEn || product.category}
            </span>
            <h1
              data-testid="text-product-name"
              className="mt-1 font-display text-2xl md:text-4xl font-extrabold text-foreground leading-snug"
            >
              {displayName}
            </h1>

            {/* Ratings & Stock Badge */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#F8EBEA] px-2.5 py-1 rounded-full border border-accent/20">
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-foreground">{product.rating}</span>
                <span className="text-xs text-muted-foreground">({product.reviewCount} {isAr ? 'تقييم موثق' : 'reviews'})</span>
              </div>

              {/* Dynamic Stock Indicator */}
              {currentStock <= 5 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full animate-pulse">
                  <AlertCircle className="size-3.5" />
                  {isAr ? `متبقي ${currentStock} قطع فقط في المخزن!` : `Only ${currentStock} units left in stock!`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  <CheckCircle2 className="size-3.5" />
                  {t('product.in_stock')}
                </span>
              )}
            </div>

            {/* Price Row */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-extrabold font-mono-brand text-[#4A1525]">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-base text-muted-foreground line-through font-mono-brand opacity-60">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              {product.compareAtPrice && (
                <span className="rounded-full bg-[#D48B88] px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                  {isAr ? `وفرتي ${product.compareAtPrice - product.price} ج.م` : `Save ${product.compareAtPrice - product.price} EGP`}
                </span>
              )}
            </div>
          </div>

          {/* Shade & Variant Swatches */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-[#EFE8DE] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  {t('pdp.select_shade')}
                </span>
                <span className="font-bold text-[#4A1525]">
                  {isAr ? variant?.nameAr : (variant?.nameEn || variant?.nameAr)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {product.variants.map((v, idx) => (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setSelectedVariant(idx)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs ${
                      selectedVariant === idx
                        ? 'border-[#4A1525] bg-[#F8EBEA] text-[#4A1525] ring-2 ring-[#4A1525]/20'
                        : 'border-[#EFE8DE] bg-white text-muted-foreground hover:border-[#D48B88]'
                    }`}
                  >
                    <span
                      className="size-4 rounded-full border border-black/10 shrink-0 shadow-xs"
                      style={{ backgroundColor: v.hex }}
                    />
                    <span>{isAr ? v.nameAr : (v.nameEn || v.nameAr)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Stepper & Instant Purchase Card */}
          <div className="rounded-[28px] border border-[#EFE8DE] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">{t('cart.total')}:</span>
                <span className="text-2xl font-extrabold font-mono-brand text-[#4A1525]">
                  {formatPrice(product.price * quantity)}
                </span>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center rounded-full border border-[#EFE8DE] bg-[#FDFBF7] px-2 py-1 shadow-2xs">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-90"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center font-mono-brand text-sm font-bold text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-90"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            {/* CTAs: Add to Cart + Buy Now Instant COD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="button-add-to-cart"
                onClick={addToBag}
                className={`flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-xs md:text-sm font-bold transition-all duration-300 active:scale-95 shadow-xs ${
                  addedNotice
                    ? 'bg-[#38101C] text-white'
                    : 'bg-white border-2 border-[#4A1525] text-[#4A1525] hover:bg-[#F8EBEA]'
                }`}
              >
                {addedNotice ? (
                  <>
                    <Check className="size-4.5 animate-in zoom-in" strokeWidth={2.5} />
                    <span>{isAr ? 'تمت الإضافة للسلة!' : 'Added to Bag!'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="size-4.5" strokeWidth={1.5} />
                    <span>{t('product.add_to_cart')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={buyNowDirect}
                className="flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-xs md:text-sm font-bold text-white bg-[#4A1525] hover:bg-[#38101C] shadow-md shadow-[#4A1525]/20 transition-all duration-300 active:scale-95"
              >
                <Zap className="size-4 text-[#E8A598]" />
                <span>{t('product.buy_now')}</span>
              </button>
            </div>
          </div>

          {/* Delivery & Assurance Guarantees */}
          <div className="space-y-2.5 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-[#D48B88] shrink-0" />
              <span>{t('pdp.fast_delivery_estimate')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#D48B88] shrink-0" />
              <span>{t('pdp.easy_returns')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#D48B88] shrink-0" />
              <span>{t('pdp.safety_guarantee')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Ingredients, How to Use, Reviews */}
      <div className="mt-16 rounded-[32px] border border-[#EFE8DE] bg-white p-6 md:p-10 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 border-b border-[#EFE8DE] pb-4 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition ${
              activeTab === 'desc'
                ? 'bg-[#4A1525] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground bg-[#F8EBEA]/50'
            }`}
          >
            {t('pdp.tab_description')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition ${
              activeTab === 'ingredients'
                ? 'bg-[#4A1525] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground bg-[#F8EBEA]/50'
            }`}
          >
            {t('pdp.tab_ingredients')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('howTo')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition ${
              activeTab === 'howTo'
                ? 'bg-[#4A1525] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground bg-[#F8EBEA]/50'
            }`}
          >
            {t('pdp.tab_how_to_use')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition ${
              activeTab === 'reviews'
                ? 'bg-[#4A1525] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground bg-[#F8EBEA]/50'
            }`}
          >
            {t('pdp.tab_reviews')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'desc' && (
          <div className="prose prose-sm max-w-none text-foreground/85 leading-relaxed space-y-4">
            <p className="text-sm md:text-base leading-relaxed">{displayDescription}</p>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="space-y-4 text-sm text-foreground/85">
            <h3 className="font-display font-bold text-base text-foreground">
              {isAr ? 'تركيبة غنية بخلاصات نقية طبيعية' : 'Pure Botanical Actives'}
            </h3>
            <p className="leading-relaxed bg-[#F8EBEA] p-4 rounded-2xl border border-accent/20">
              {displayIngredients || (isAr ? 'تركيبة نباتية خالية من البارابين والزيوت المعدنية الضارة.' : 'Botanical formula free from parabens and mineral oils.')}
            </p>
          </div>
        )}

        {activeTab === 'howTo' && (
          <div className="space-y-4 text-sm text-foreground/85">
            <h3 className="font-display font-bold text-base text-foreground">
              {isAr ? 'طقوس الاستخدام المثالية لنتائج مبهرة' : 'The Ideal Application Ritual'}
            </h3>
            <p className="leading-relaxed bg-[#F8EBEA] p-4 rounded-2xl border border-accent/20">
              {displayHowToUse || (isAr ? 'يُستخدم يومياً صباحاً ومساءً على بشرة نظيفة للحصول على أقصى ترطيب ونضارة.' : 'Use daily morning and evening on clean skin for optimal radiance.')}
            </p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {isAr ? 'تجارب وآراء العميلات' : 'Verified Client Reviews'}
                </h3>
                <p className="text-xs text-muted-foreground">{product.rating} من 5 نجوم · بناءً على {product.reviewCount} تقييم</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">هدى سليم</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">✓ مشترية موثقة</span>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">
                  {isAr
                    ? 'المنتج فاق توقعاتي بكتير! التغليف لوحده تحفة فنية والتركيبة فرقت في بشرتي من أول استخدامين.'
                    : 'Exceeded all expectations! Breathtaking packaging and truly transformative texture from the first uses.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">داليا الألفي</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">✓ مشترية موثقة</span>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">
                  {isAr
                    ? 'شحن سريع جداً وصلني تاني يوم في المعادي، وأهم حاجة إني قدرت أعاين الأوردر قبل ما أدفع للمندوب.'
                    : 'Next-day delivery to Maadi! Loved the option to inspect the parcel before paying the courier.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-[#EFE8DE] pt-14">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <span className="font-mono-brand text-xs font-bold text-[#D48B88] tracking-widest uppercase">
                {isAr ? 'مختارات ملكية لكِ' : 'Curated For You'}
              </span>
              <h3 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">
                {isAr ? 'منتجات مقترحة تتناغم مع اختياركِ' : 'Complementary Beauty Pairings'}
              </h3>
            </div>
            <Link href="/shop" className="text-xs font-bold text-[#4A1525] hover:underline">
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

      {/* Sticky Mobile Purchase Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-lg border-t border-[#EFE8DE] p-3 px-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-muted-foreground block">{t('cart.total')}</span>
            <span className="text-base font-extrabold font-mono-brand text-[#4A1525]">
              {formatPrice(product.price * quantity)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addToBag}
              className="px-4 py-2.5 rounded-full border border-[#4A1525] text-[#4A1525] text-xs font-bold hover:bg-[#F8EBEA] transition"
            >
              {addedNotice ? '✓ تمت' : t('product.add_to_cart')}
            </button>
            <button
              type="button"
              onClick={buyNowDirect}
              className="px-5 py-2.5 rounded-full bg-[#4A1525] text-white text-xs font-bold shadow-md shadow-[#4A1525]/20 hover:bg-[#38101C] transition"
            >
              {t('product.buy_now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}