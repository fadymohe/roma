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
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { DEFAULT_PRODUCTS, useLiveProducts, getProductDiscount, type Product } from '@/lib/catalog-data';
import { ProductCard } from '@/components/product-card';

function getProductReviews(product: Product, isAr: boolean) {
  const numId = typeof product.id === 'number'
    ? product.id
    : Array.from(String(product.id || '1')).reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const isPerfume = Boolean(product.category?.includes('عطر') || product.categoryEn?.toLowerCase().includes('perfume'));
  const isHair = Boolean(product.category?.includes('شعر') || product.categoryEn?.toLowerCase().includes('hair'));
  const isJewelry = Boolean(product.category?.includes('مجوهرات') || product.categoryEn?.toLowerCase().includes('jewelry'));
  const isBeauty = Boolean(product.category?.includes('مكياج') || product.category?.includes('جسم') || product.category?.includes('عناية'));

  const names = [
    { ar: 'نوران الشناوي', en: 'Nouran El-Shenawy', loc: 'التجمع الخامس' },
    { ar: 'سارة المهدي', en: 'Sarah El-Mahdy', loc: 'مصر الجديدة' },
    { ar: 'مريم القاضي', en: 'Mariam El-Qady', loc: 'المعادي' },
    { ar: 'حبيبة الجوهري', en: 'Habiba El-Gohary', loc: 'الشيخ زايد' },
    { ar: 'ياسمين خليل', en: 'Yasmine Khalil', loc: 'الإسكندرية' },
    { ar: 'ندى الشريف', en: 'Nada El-Sherif', loc: 'الدقي' },
    { ar: 'آية منصور', en: 'Aya Mansour', loc: 'المنصورة' },
    { ar: 'سلمى رضوان', en: 'Salma Radwan', loc: 'مدينة نصر' },
    { ar: 'دينا عثمان', en: 'Dina Othman', loc: 'المهندسين' },
    { ar: 'فريدة زايد', en: 'Farida Zayed', loc: 'طنطا' },
    { ar: 'ملك الباز', en: 'Malak El-Baz', loc: 'الزمالك' },
    { ar: 'هاجر السعيد', en: 'Hagar El-Saeed', loc: 'الشروق' },
  ];

  const perfumeReviews = [
    { ar: 'ريحته فواحة جداً وثباته فضل معايا أكتر من ٢٤ ساعة على الهدوم. كل اللي شمه سألني عنه!', en: 'Incredible scent and lasting sillage! Stayed on my clothes over 24 hours.' },
    { ar: 'عطر راقي جداً وأنثوي بدون مبالغة، الزجاجة تحفة والتغليف وصل سليم وفي وقت قياسي.', en: 'Very sophisticated and feminine. The bottle looks luxurious on the vanity.' },
    { ar: 'بديل ممتاز وفخم وثابت، ريحته ناعمة وهادية ومناسبة جداً للاستخدام اليومي والمناسبات.', en: 'Superb quality and long-lasting aroma. Perfect for daily wear and evening events.' },
    { ar: 'طلبته هدية لأختي وعجبها جداً، وميزة معاينة الأوردر قبل الدفع خلتني أطلب وأنا مطمنة.', en: 'Bought it as a gift and she absolutely loved it. Loved the pay-on-delivery inspection!' },
  ];

  const hairReviews = [
    { ar: 'الخامة ممتازة ومابتنتش الشعر خالص، ماسكة كويس جداً في الشعر التقيل وثابتة طول اليوم.', en: 'Great material that does not pull hair. Holds thick hair securely all day long.' },
    { ar: 'شكلها شيك جداً وكيوت في الحقيقة أحلى من الصور بكتير، وسعرها تحفة مقارنة بالمحلات.', en: 'Even cuter in person than photos! Exceptional value and premium finish.' },
    { ar: 'القطع ألوانها مبهجة ونظيفة، بنتي فرحت بيها جداً ومرنة ومريحة في اللبس.', en: 'Vibrant colors and gentle on the hair. My daughter was thrilled with it!' },
    { ar: 'المشبك قوي ومتين ومبيفكش بسهولة، والتوصيل وصل تاني يوم على طول.', en: 'Sturdy clamp, durable spring, and fast delivery the next day.' },
  ];

  const jewelryReviews = [
    { ar: 'الفينش روعة ولمعانها فخم ومبيغيرش لون، كأنها قطعة دهب حقيقي بالظبط!', en: 'Stunning shine and finish! Looks like real fine jewelry and hasn’t tarnished.' },
    { ar: 'رقيقة جداً وأنيقة في اللبس ومقاسها مظبوط بالمللي. التغليف كمان ينفع هدية شيك.', en: 'Dainty and elegant on the wrist/neck. Perfect gift packaging.' },
    { ar: 'أول مرة أطلب إكسسوار أونلاين وتطلع الجودة ممتازة كده. مندوب التوصيل كان محترم جداً.', en: 'First time ordering jewelry online and exceeded my expectations!' },
  ];

  const beautyReviews = [
    { ar: 'الملمس ناعم وخفيف جداً، مش بيدهن خالص وبيدي نضارة فورية وطبيعية.', en: 'Super smooth and lightweight texture, absorbs fast without greasiness.' },
    { ar: 'مكوناته لطيفة ومسببش أي حساسية لبشرتي، من أحسن المنتجات اللي جربتها الفترة دي.', en: 'Gentle on sensitive skin with no irritation. Truly a daily staple.' },
    { ar: 'النتيجة بانت معايا من أول أسبوع، تغليف ممتاز وريحة المنتج هادية ونظيفة.', en: 'Noticed visible results within the first week. Clean, pleasant scent.' },
  ];

  const pool = isPerfume ? perfumeReviews : isHair ? hairReviews : isJewelry ? jewelryReviews : beautyReviews;

  const name1 = names[numId % names.length];
  const name2 = names[(numId + 5) % names.length];
  const rev1 = pool[numId % pool.length];
  const rev2 = pool[(numId + 2) % pool.length];

  const rating1 = 5;
  const rating2 = numId % 3 === 0 ? 4 : 5;

  return [
    {
      name: isAr ? name1.ar : name1.en,
      location: isAr ? name1.loc : name1.loc,
      rating: rating1,
      text: isAr ? rev1.ar : rev1.en,
      time: isAr ? 'منذ يومين' : '2 days ago',
    },
    {
      name: isAr ? name2.ar : name2.en,
      location: isAr ? name2.loc : name2.loc,
      rating: rating2,
      text: isAr ? rev2.ar : rev2.en,
      time: isAr ? 'منذ ٥ أيام' : '5 days ago',
    },
  ];
}

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

  // Always scroll to top when opening or switching products
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  // Match product from live dynamic list or default products
  const product: Product =
    liveProducts.find((p) => p.slug === slug) ||
    DEFAULT_PRODUCTS.find((p) => p.slug === slug) ||
    liveProducts[0] ||
    DEFAULT_PRODUCTS[0];

  const variant = product.variants?.[selectedVariant] || product.variants?.[0];
  const favorited = isWishlisted(product.id);

  const reviews = useMemo(() => getProductReviews(product, isAr), [product, isAr]);

  const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
  const displayDescription = isAr ? product.descriptionAr : (product.descriptionEn || product.descriptionAr);
  const displayIngredients = isAr ? product.ingredientsAr : (product.ingredientsEn || product.ingredientsAr);
  const displayHowToUse = isAr ? product.howToUseAr : (product.howToUseEn || product.howToUseAr);
  const displayBadge = isAr ? product.badge : (product.badgeEn || product.badge);
  const { discountPercent, compareAtPrice: effectiveCompareAtPrice } = getProductDiscount(product);

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

  // Extract Amazon specs/ingredients/features from description
  const parsedDetails = useMemo(() => {
    const desc = isAr ? product.descriptionAr : (product.descriptionEn || product.descriptionAr) || '';
    const isPerfume = Boolean(product.category?.includes('عطر') || product.categoryEn?.toLowerCase().includes('perfume'));
    const isAccessory = Boolean(
      product.category?.includes('شعر') ||
      product.category?.includes('إكسسوار') ||
      product.category?.includes('مجوهرات') ||
      product.categoryEn?.toLowerCase().includes('jewelry') ||
      product.categoryEn?.toLowerCase().includes('accessories')
    );

    // Extract bullet points (lines starting with •, -, or *)
    const lines = desc.split('\n').map((l) => l.trim()).filter(Boolean);
    const bullets = lines
      .filter((l) => l.startsWith('•') || l.startsWith('-') || (l.startsWith('*') && !l.includes('أبرز المميزات')))
      .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean);

    return {
      isPerfume,
      isAccessory,
      bullets,
      title: isPerfume
        ? isAr
          ? 'النوتات والتركيبة العطرية'
          : 'Fragrance Notes & Composition'
        : isAccessory
        ? isAr
          ? 'الخامات والمواصفات التفصيلية'
          : 'Materials & Specifications'
        : isAr
        ? 'المكونات الفعالة والمميزات'
        : 'Active Ingredients & Highlights',
    };
  }, [product, isAr]);

  // Recommended products strictly prioritized from the SAME category
  const relatedProducts = useMemo(() => {
    const sameCat = liveProducts.filter(
      (p) =>
        p.id !== product.id &&
        ((product.category && p.category === product.category) ||
          (product.categoryEn && p.categoryEn === product.categoryEn))
    );
    const backfill = liveProducts.filter(
      (p) => p.id !== product.id && !sameCat.some((sc) => sc.id === p.id)
    );
    return [...sameCat, ...backfill].slice(0, 4);
  }, [liveProducts, product]);

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
            className="relative aspect-square md:aspect-[4/3] max-h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[#141414] p-4 sm:p-6 flex items-center justify-center shadow-xl group select-none"
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
                } else {
                  target.src = '/logo-white-bg.png';
                }
              }}
              className="max-h-[380px] md:max-h-[420px] max-w-full h-auto w-auto object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105 drop-shadow-2xl"
            />

            {/* Badge */}
            {displayBadge && (
              <span className="absolute top-5 right-5 rounded-full bg-[#D4A5A5]/20 text-[#D4A5A5] border border-[#D4A5A5]/30 text-[11px] font-medium px-2.5 py-0.5 shadow-md">
                {displayBadge}
              </span>
            )}

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

          {/* Sleek Image Gallery Thumbnails directly underneath */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border transition-all shrink-0 p-0.5 bg-[#141414] ${
                    selectedImage === idx
                      ? 'border-[#D4A5A5] shadow-md shadow-[#D4A5A5]/20 ring-1 ring-[#D4A5A5]'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (img?.startsWith('/uploads/') && !target.src.includes('raw.githubusercontent.com')) {
                        target.src = `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public${img}`;
                      } else {
                        target.src = '/logo-white-bg.png';
                      }
                    }}
                    className="h-full w-full object-contain rounded-lg p-0.5"
                  />
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

        {/* Right Column: Title, Pricing & Purchase Block */}
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

              {/* In Stock Badge */}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
                <CheckCircle2 className="size-3.5" />
                <span>{isAr ? 'متوفر في المخزون' : 'In Stock'}</span>
              </span>
            </div>

            {/* Price Row (Pure White Price) */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-extrabold font-mono-brand text-white">
                {formatPrice(product.price)}
              </span>
              {effectiveCompareAtPrice && effectiveCompareAtPrice > product.price && (
                <span className="text-base text-[#A1A1AA] line-through font-mono-brand opacity-60">
                  {formatPrice(effectiveCompareAtPrice)}
                </span>
              )}
              {effectiveCompareAtPrice && effectiveCompareAtPrice > product.price && (
                <span className="rounded-full bg-rose-500 text-white px-2.5 py-0.5 text-xs font-bold shadow-xs">
                  {discountPercent ? `-${discountPercent}%` : (isAr ? `وفرتي ${effectiveCompareAtPrice - product.price} ج.م` : `Save ${effectiveCompareAtPrice - product.price} EGP`)}
                </span>
              )}
            </div>
          </div>

          {/* Purchase Action Block */}
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

              {/* Secondary CTA: Add to Bag */}
              <button
                type="button"
                data-testid="button-add-to-cart"
                onClick={addToBag}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-[#D4A5A5]/40 text-[#D4A5A5] hover:bg-[#D4A5A5]/10 py-3.5 px-6 text-sm font-bold transition active:scale-[0.99]"
              >
                <ShoppingBag className="size-4 text-[#D4A5A5]" />
                <span>
                  {addedNotice
                    ? isAr
                      ? '✓ تمت الإضافة إلى الحقيبة بنجاح!'
                      : '✓ Added to Bag!'
                    : t('product.add_to_cart')}
                </span>
              </button>
            </div>

            {/* Primary CTA: High-emphasis Fast Cash Buy Now (Bright colors, pure white font) */}
            <button
              type="button"
              data-testid="button-buy-now"
              onClick={buyNowDirect}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#F2A7A7] via-[#E99797] to-[#DF8C8C] text-white font-extrabold shadow-lg shadow-rose-400/25 hover:brightness-105 py-3.5 px-6 text-sm md:text-base transition active:scale-[0.99] tracking-wide"
            >
              <Zap className="size-4.5 text-white fill-white shrink-0" />
              <span className="text-white drop-shadow-xs font-bold">{isAr ? 'شراء سريع كاش (الدفع عند الاستلام)' : t('product.buy_now')}</span>
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
            {parsedDetails.isAccessory
              ? isAr
                ? 'الخامات والمواصفات'
                : 'Materials & Specs'
              : parsedDetails.isPerfume
              ? isAr
                ? 'النوتات والتركيبة'
                : 'Fragrance Notes'
              : t('pdp.tab_ingredients')}
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
              <p className="text-sm md:text-base leading-relaxed text-white/90 whitespace-pre-line">{displayDescription}</p>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4 text-sm text-[#A1A1AA]">
              <h3 className="font-display font-bold text-base text-white">
                {parsedDetails.title}
              </h3>

              {displayIngredients ? (
                <div className="leading-relaxed bg-[#141414] p-4 md:p-5 rounded-2xl border border-white/10 text-white/90 whitespace-pre-line">
                  {displayIngredients}
                </div>
              ) : parsedDetails.bullets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedDetails.bullets.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-white/10 bg-[#141414] flex items-start gap-2.5 text-white/90"
                    >
                      <Sparkles className="size-4 text-[#D4A5A5] shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm leading-relaxed">{b}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="leading-relaxed bg-[#141414] p-4 md:p-5 rounded-2xl border border-white/10 text-zinc-400">
                  <p className="text-xs md:text-sm leading-relaxed">
                    {isAr ? 'غير متوفر' : 'Not available'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'howTo' && (
            <div className="space-y-4 text-sm text-[#A1A1AA]">
              <h3 className="font-display font-bold text-base text-white">
                {isAr ? 'طريقة الاستخدام' : 'How to Use'}
              </h3>
              <div className="leading-relaxed bg-[#141414] p-4 rounded-2xl border border-white/10 text-white/90 whitespace-pre-line">
                {displayHowToUse ? (
                  <p>{displayHowToUse}</p>
                ) : (
                  <p className="text-zinc-400">{isAr ? 'غير متوفر' : 'Not available'}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    {isAr ? 'تجارب وآراء العميلات' : 'Verified Client Reviews'}
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    {reviews.length > 0
                      ? `${(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} من 5 نجوم · بناءً على ${reviews.length} تقييمات موثقة`
                      : `${product.rating} من 5 نجوم · بناءً على ${product.reviewCount} تقييم`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-white/10 bg-[#141414] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{rev.name}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 font-bold px-2 py-0.5 rounded-full border border-emerald-800/40">
                          {isAr ? '✓ مشترية موثقة' : '✓ Verified Buyer'}
                        </span>
                        {rev.city && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            • {rev.city}
                          </span>
                        )}
                      </div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="size-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Products Carousel - Category Specific */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-white/10 pt-14">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-white md:text-3xl">
                {isAr ? 'المنتجات المقترحة لك' : 'Suggested Products for You'}
              </h3>
            </div>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category || product.categoryEn || '')}`}
              className="text-xs font-bold text-[#D4A5A5] hover:underline"
            >
              {isAr ? 'عرض الكل' : 'View All'}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LUXURY STICKY MOBILE ACTION BAR                                           */}
      {/* Sits right above or on bottom on mobile viewport                          */}
      {/* ========================================================================= */}
      <div className="fixed bottom-14 left-0 right-0 z-40 md:hidden bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 p-3 px-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-400 block">{t('cart.total')}</span>
            <span className="text-base font-extrabold font-mono-brand text-white">
              {formatPrice(product.price * quantity)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addToBag}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border border-[#D4A5A5]/40 text-[#D4A5A5] hover:bg-[#D4A5A5]/10 ${
                addedNotice ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : ''
              }`}
            >
              {addedNotice ? '✓ تمت الإضافة' : t('product.add_to_cart')}
            </button>
            <button
              type="button"
              onClick={buyNowDirect}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A7A7] via-[#E99797] to-[#DF8C8C] text-white font-extrabold shadow-lg shadow-rose-400/25 hover:brightness-105 text-xs transition active:scale-95"
            >
              {isAr ? 'شراء سريع كاش' : t('product.buy_now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}