import { Crown, Star, ShoppingBag, Sparkles, Quote, CheckCircle2, MessageCircle, ArrowLeft, ArrowRight, Boxes, Construction, BadgeCheck, Flame, ChevronLeft, ChevronRight, Timer, ShieldCheck, Truck, Gem } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/product-card';
import { CATEGORIES, TESTIMONIALS, useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';

const HERO_SHOWCASE_IMAGES = [
  { src: '/hero/hero-1.jpg', alt: 'مستحضرات تجميل وأحمر شفاه فاخر' },
  { src: '/hero/hero-2.jpg', alt: 'مجموعة تحديد وتجميل الشفاه الوردية' },
  { src: '/hero/hero-3.jpg', alt: 'باليت ظلال عيون ومستحضرات احترافية' },
  { src: '/hero/hero-4.jpg', alt: 'كريم الأساس والتغطية المخملية' },
];

export default function Home() {
  const { t, isAr, dir } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentHeroImageIdx, setCurrentHeroImageIdx] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Auto-switch hero showcase image every 4 seconds (pauses on hover)
  useEffect(() => {
    if (isHeroHovered) return;
    const heroTimer = setInterval(() => {
      setCurrentHeroImageIdx((prev) => (prev + 1) % HERO_SHOWCASE_IMAGES.length);
    }, 4000);
    return () => clearInterval(heroTimer);
  }, [isHeroHovered]);

  const handleNext = () => {
    setCurrentHeroImageIdx((prev) => (prev + 1) % HERO_SHOWCASE_IMAGES.length);
  };

  const handlePrev = () => {
    setCurrentHeroImageIdx((prev) => (prev - 1 + HERO_SHOWCASE_IMAGES.length) % HERO_SHOWCASE_IMAGES.length);
  };

  const [timeLeft, setTimeLeft] = useState({ days: '07', hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    const STORAGE_KEY = 'roma_flash_sale_7d_target';
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    let targetTime: number;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        targetTime = parseInt(stored, 10);
        if (isNaN(targetTime) || targetTime <= Date.now()) {
          targetTime = Date.now() + SEVEN_DAYS_MS;
          localStorage.setItem(STORAGE_KEY, String(targetTime));
        }
      } else {
        targetTime = Date.now() + SEVEN_DAYS_MS;
        localStorage.setItem(STORAGE_KEY, String(targetTime));
      }
    } catch {
      targetTime = Date.now() + SEVEN_DAYS_MS;
    }

    const updateCountdown = () => {
      const now = Date.now();
      let diff = Math.max(0, targetTime - now);
      if (diff === 0) {
        targetTime = Date.now() + SEVEN_DAYS_MS;
        try { localStorage.setItem(STORAGE_KEY, String(targetTime)); } catch {}
        diff = SEVEN_DAYS_MS;
      }

      const d = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
      const h = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
      const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const bestsellersSliderRef = useRef<HTMLDivElement>(null);
  const under10SliderRef = useRef<HTMLDivElement>(null);

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (!ref.current) return;
    const el = ref.current;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 300);
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Dynamic live products synced with Telegram Bot, falling back to rich defaults
  const liveProducts = useLiveProducts();
  const featuredProducts = liveProducts.length > 0 ? liveProducts : DEFAULT_PRODUCTS;

  // 1. Under 10 EGP products
  const under10Products = featuredProducts.filter(
    (p) => p && typeof p.price === 'number' && p.price <= 10
  );

  // Helper to score true Amazon bestsellers by demand, rating, and brand appeal
  const getBestsellerScore = (product: any): number => {
    if (!product) return 0;
    let score = 0;
    const name = (product.nameAr || '').toLowerCase();
    const price = Number(product.price) || 0;

    // Real Amazon bestsellers are desirable, quality products (30 - 900 EGP)
    if (price >= 35 && price <= 900) score += 20;
    if (price >= 50 && price <= 500) score += 15;
    if (price > 10) score += 10;
    else score -= 150; // Keep under 10 items in the under 10 section

    if (product.compareAtPrice && product.compareAtPrice > price) score += 15;

    // High-demand Amazon bestseller keywords across fragrances, jewelry, skincare, cosmetics
    if (/ماء\s*الذهب|لطافة|امير\s*العود|فانيليا|عطر|برفان|parfum/i.test(name)) score += 35;
    if (/توليب|زركون|فان\s*كليف|سوار|خاتم|قلادة|عقد|لؤلؤ|ذهب/i.test(name)) score += 30;
    if (/يولو|لونا|شيجلام|sheglam|جل\s*سائل|ماسكارا|روج|ليب/i.test(name)) score += 25;
    if (/سيروبيب|الفيف|لوريال|كيراتين|شامبو|سيروم|لوشن|ايفا/i.test(name)) score += 25;
    if (/طقم|مجموعة|باكيت|بوكس|قطع/i.test(name)) score += 20;
    if (/حزام|شنطة|حقيبة|ساعة/i.test(name)) score += 20;

    if (Array.isArray(product.additionalImages) && product.additionalImages.length > 0) {
      score += Math.min(product.additionalImages.length * 5, 20);
    }

    return score;
  };

  // Candidates for Amazon Bestsellers (excludes cheap under 10 items)
  const bestsellersCandidates = featuredProducts.filter(
    (p) => p && typeof p.price === 'number' && p.price > 10
  );

  // 2. Amazon Bestsellers Selection
  let displayedProducts: any[] = [];

  if (activeCategory === 'all') {
    // Interleave top-scoring products across major categories for a balanced, luxurious showcase
    const isPerfume = (c: string, n: string) => (c.includes('عطر') || /عطر|برفان|parfum|كولونيا|بودي\s*ميست|رذاذ/i.test(n));
    const isJewelry = (c: string, n: string) => !isPerfume(c, n) && !/حزام/i.test(n) && (c.includes('مجوهرات') || /سوار|خاتم|سلس|قلاد|عقد|انسيال|حلق|أقراط|اقراط|خلخال|زركون/i.test(n));
    const isMakeup = (c: string, n: string) => !isPerfume(c, n) && (c.includes('مكياج') || /أظافر|روج|ليب|مسكر|ماسكارا|كحل|بلش|بلاشر|فاونديشن|بودر|شيجلام|يولو/i.test(n));
    const isCare = (c: string, n: string) => !isPerfume(c, n) && !isJewelry(c, n) && (c.includes('عناية') || /لوشن|شامبو|سيروم|كريم|مرطب|غسول|فازلين/i.test(n));
    const isLook = (c: string, n: string) => !isPerfume(c, n) && (c.includes('إطلالة') || c.includes('اطلالة') || /حزام|أحزمة|احزمة|ساعة|ساعات|شنط|حقيب|محفظ/i.test(n));
    const isHair = (c: string, n: string) => !isPerfume(c, n) && !/حزام/i.test(n) && (c.includes('شعر') || /توك|طوق|دبابيس|مشبك|مشابك|كليبس|باندان|سكرانشي/i.test(n));

    const categoriesDef = [
      { name: 'العطور الفاخرة', fn: isPerfume },
      { name: 'مجوهرات اليد والعنق', fn: isJewelry },
      { name: 'المكياج والجمال', fn: isMakeup },
      { name: 'العناية بالجسم والنعومة', fn: isCare },
      { name: 'إكسسوارات الإطلالة', fn: isLook },
      { name: 'إكسسوارات الشعر', fn: isHair },
    ];

    const categoryPools = categoriesDef.map((cat) =>
      bestsellersCandidates
        .filter((p) => cat.fn((p.category || '').toLowerCase(), (p.nameAr || '').toLowerCase()))
        .sort((a, b) => getBestsellerScore(b) - getBestsellerScore(a))
    );

    const interleaved: any[] = [];
    const seenIds = new Set<string | number>();

    for (let i = 0; i < 6; i++) {
      categoryPools.forEach((pool) => {
        if (pool[i] && !seenIds.has(pool[i].id)) {
          seenIds.add(pool[i].id);
          interleaved.push(pool[i]);
        }
      });
    }

    displayedProducts = interleaved.length > 0 ? interleaved : bestsellersCandidates.sort((a, b) => getBestsellerScore(b) - getBestsellerScore(a));
  } else {
    // When a specific category is chosen, filter by category and sort by bestseller score
    displayedProducts = bestsellersCandidates
      .filter((p) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.nameAr || '').toLowerCase();

        if (activeCategory === 'hair-accessories') {
          return !/عطر|حزام/i.test(name) && (cat.includes('إكسسوارات الشعر') || cat === 'hair-accessories' || /توك|توكة|توكه|ربط(ة|ه|ات)\s*شعر|استك|طوق|شريط\s*ر(أ|ا)س|عصاب|مشبك|مشابك|شابك|كليبس|بندان|باندانا|سكرانشي|scrunch|فيونك|كلبس|بنس|هير\s*بيس|دبابيس|مشط|تاج/i.test(name));
        }
        if (activeCategory === 'look-accessories') {
          return !/عطر/i.test(name) && (cat.includes('إكسسوارات الإطلالة') || cat === 'look-accessories' || /حزام|أحزمة|احزمة|نظار|حقيب|شنط|محفظ|محافظ|ساع(ة|ه|ات)|watch|bag|handbag|crossbody|سكارف|شال|إشارب|ايشارب|كاب|قبع|إبزيم|ابزيم|بروش/i.test(name));
        }
        if (activeCategory === 'jewelry') {
          return !/عطر|حزام/i.test(name) && ((cat.includes('مجوهرات اليد والعنق') || cat === 'jewelry') || /سلسل|سلاسل|قلاد|عقد|كولي|خاتم|خواتم|اسور|أساور|سوار|انسيال|حلق|أقراط|اقراط|خلخال|خلاخل|دلاي|زركون|لؤلؤ/i.test(name));
        }
        if (activeCategory === 'makeup') {
          return !/عطر/i.test(name) && (cat.includes('المكياج والجمال') || cat === 'makeup' || /روج|أحمر\s*(شفاه|خدود)|احمر\s*(شفاه|خدود)|شفاه|ليب|lip|مسكر|ماسكارا|mascara|كحل|ايلاينر|آيلاينر|محدد|طلاء\s*أظافر|مانيكير|اظافر|أظافر|بلاشر|بلش|مورد|كونسيلر|فاونديشن|كريم\s*اساس|بودر|ايشادو|ظلال|هايلايتر|كونتور|برايمر|مكياج|makeup|فرش\s*مكياج|بيوتي\s*بلندر|منظم\s*مكياج|رموش|يولو|توب\s*كوت|بيس\s*شيلد|شيجلام|sheglam/i.test(name));
        }
        if (activeCategory === 'body-care') {
          return !/عطر|حزام/i.test(name) && (cat.includes('العناية بالجسم') || cat === 'body-care' || /لوشن|مرطب|كريم|غسول|سيروم|زيت|مقشر|سكراب|صابون|شاور|ماسك|قناع|فازلين|مزيل\s*عرق|ديودورنت|جل\s*الصبار|واقي\s*شمس|صن\s*بلوك|شامبو|بلسم|عناية/i.test(name));
        }
        if (activeCategory === 'perfumes') {
          return cat.includes('العطور الفاخرة') || cat === 'perfumes' || /عطر|عطور|برفان|بارفيوم|parfum|perfume|مسك|عود|بخور|كولونيا|او\s*(دي|دو)|eau\s*d|بودي\s*ميست|رذاذ/i.test(name);
        }
        return cat.includes(activeCategory);
      })
      .sort((a, b) => getBestsellerScore(b) - getBestsellerScore(a));
  }

  const categoryPills = [
    { id: 'all', label: isAr ? 'جميع المنتجات' : 'All Products' },
    { id: 'hair-accessories', label: isAr ? 'إكسسوارات الشعر' : 'Hair Accessories' },
    { id: 'look-accessories', label: isAr ? 'إكسسوارات الإطلالة' : 'Look Accessories' },
    { id: 'jewelry', label: isAr ? 'مجوهرات اليد والعنق' : 'Jewelry' },
    { id: 'makeup', label: isAr ? 'المكياج والجمال' : 'Makeup & Beauty' },
    { id: 'body-care', label: isAr ? 'العناية والنعومة' : 'Body Care' },
    { id: 'perfumes', label: isAr ? 'العطور الفاخرة' : 'Perfumes' },
  ];

  return (
    <div dir={dir} className="space-y-10 md:space-y-16 py-4 md:py-8 text-[#F9FAFB]">

      {/* ========================================================================= */}
      {/* FULL-BLEED LUXURY HERO BANNER CAROUSEL                                     */}
      {/* ========================================================================= */}
      <section className="roma-container relative">
        <div
          onMouseEnter={() => setIsHeroHovered(true)}
          onMouseLeave={() => setIsHeroHovered(false)}
          className="group relative w-full h-[190px] sm:h-[260px] md:h-[330px] lg:h-[380px] rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-[#0E0E0E] shadow-2xl select-none"
        >
          {/* Entire banner is a link to the shop */}
          <Link
            href="/shop"
            className="block w-full h-full relative cursor-pointer overflow-hidden"
            aria-label={isAr ? 'تسوقي التشكيلة الكاملة' : 'Shop All Products'}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={currentHeroImageIdx}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={HERO_SHOWCASE_IMAGES[currentHeroImageIdx].src}
                  alt={HERO_SHOWCASE_IMAGES[currentHeroImageIdx].alt}
                  className="w-full h-full object-cover object-center select-none"
                />
              </motion.div>
            </AnimatePresence>

            {/* Subtle luxury edge vignette */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 z-10" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl md:rounded-3xl z-10" />
          </Link>

          {/* Sleek Glassmorphic Pagination Indicators */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
            {HERO_SHOWCASE_IMAGES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentHeroImageIdx(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-500 rounded-full cursor-pointer ${
                  idx === currentHeroImageIdx
                    ? 'w-6 sm:w-7 h-1.5 bg-gradient-to-r from-[#D4A5A5] to-rose-300 shadow-[0_0_10px_rgba(212,165,165,0.8)]'
                    : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Visual Grid */}
      <section className="roma-container relative">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 -top-8 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(212,165,165,0.08),transparent)] pointer-events-none" />

        <div className="mb-6 flex items-center justify-between relative z-10">
          <div>
            <span className="text-xs md:text-sm font-semibold text-[#D4A5A5] flex items-center gap-1.5">
              <Boxes className="size-3.5 text-[#D4A5A5]" />
              <span>{isAr ? 'الأقسام والمجموعات' : 'Royal Collections'}</span>
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-1.5 leading-snug">
              {t('section.categories_title')}
            </h2>
          </div>
          <Link 
            href="/categories" 
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#D4A5A5] hover:text-white px-3 py-1.5 rounded-full bg-[#D4A5A5]/10 hover:bg-[#D4A5A5]/20 border border-[#D4A5A5]/25 transition-all duration-300"
          >
            <span>{isAr ? 'تصفح كل الأقسام' : 'View All'}</span>
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1 rtl:rotate-0 ltr:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 md:gap-4 relative z-10">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-3 md:p-3.5 shadow-md hover:border-[#D4A5A5]/60 hover:shadow-[0_16px_36px_-8px_rgba(212,165,165,0.25)] hover:-translate-y-2.5 transition-all duration-500 ease-out text-center flex flex-col justify-between active:scale-95 cursor-pointer"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Shimmer Light Reflection on Hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-20" />

              {/* Image Container with seamless light background matching user photos */}
              <div className="aspect-square w-full rounded-xl md:rounded-2xl overflow-hidden mb-2.5 bg-[#EBEBEB] relative shadow-inner border border-black/5">
                <img
                  src={cat.imageUrl}
                  alt={isAr ? cat.nameAr : cat.nameEn}
                  loading="lazy"
                  className="h-full w-full object-contain p-1.5 transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              {/* Title & Micro-indicator */}
              <div className="pt-0.5">
                <h3 className="text-[12px] sm:text-[13px] font-bold text-zinc-100 group-hover:text-[#D4A5A5] transition-colors duration-300 line-clamp-1 leading-snug">
                  {isAr ? cat.nameAr : cat.nameEn}
                </h3>
                <div className="flex items-center justify-center gap-1 mt-1 text-[10px] font-semibold text-[#D4A5A5] opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <span>{isAr ? 'استكشفي' : 'Explore'}</span>
                  <ArrowLeft className="size-2.5 rtl:rotate-0 ltr:rotate-180" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers Section - الأكثر طلباً (Amazon Products) */}
      <section className="roma-container">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs md:text-sm font-semibold text-[#D4A5A5] flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#D4A5A5] animate-pulse" />
              <span>{isAr ? 'المختارات الأكثر طلباً' : 'Most Wanted Picks'}</span>
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-1.5 leading-snug">
              {t('section.bestsellers_title')}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {t('section.bestsellers_subtitle')}
            </p>
          </div>

          {/* Category Filter Pills and Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {featuredProducts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 py-1">
                {categoryPills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setActiveCategory(pill.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                      activeCategory === pill.id
                        ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md ring-2 ring-[#D4A5A5]/40'
                        : 'bg-[#141414] border border-white/10 text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Header Arrow Controls */}
            {displayedProducts.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 shrink-0 bg-[#141414] border border-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleScroll(bestsellersSliderRef, 'right')}
                  className="size-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-300 hover:text-white transition active:scale-90"
                  aria-label={isAr ? 'تحريك لليمين' : 'Scroll Right'}
                  title={isAr ? 'تحريك لليمين' : 'Scroll Right'}
                >
                  <ChevronRight className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll(bestsellersSliderRef, 'left')}
                  className="size-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-300 hover:text-white transition active:scale-90"
                  aria-label={isAr ? 'تحريك لليسار' : 'Scroll Left'}
                  title={isAr ? 'تحريك لليسار' : 'Scroll Left'}
                >
                  <ChevronLeft className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Cards Smooth Slider with Floating Side Arrows */}
        {displayedProducts.length > 0 ? (
          <div className="relative group/slider">
            {/* Floating Left Button (زر تحريك يسار بجوار المنتجات) */}
            <button
              type="button"
              onClick={() => handleScroll(bestsellersSliderRef, 'left')}
              className="absolute left-1 sm:left-2 md:-left-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-[#121212]/90 hover:bg-[#D4A5A5] text-white hover:text-[#0A0A0A] border border-white/20 hover:border-[#D4A5A5] shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:shadow-[0_0_24px_rgba(212,165,165,0.5)] backdrop-blur-md transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 select-none"
              aria-label={isAr ? 'تحريك لليسار' : 'Scroll Left'}
              title={isAr ? 'تحريك لليسار' : 'Scroll Left'}
            >
              <ChevronLeft className="size-5 sm:size-6" />
            </button>

            {/* Floating Right Button (زر تحريك يمين بجوار المنتجات) */}
            <button
              type="button"
              onClick={() => handleScroll(bestsellersSliderRef, 'right')}
              className="absolute right-1 sm:right-2 md:-right-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-[#121212]/90 hover:bg-[#D4A5A5] text-white hover:text-[#0A0A0A] border border-white/20 hover:border-[#D4A5A5] shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:shadow-[0_0_24px_rgba(212,165,165,0.5)] backdrop-blur-md transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 select-none"
              aria-label={isAr ? 'تحريك لليمين' : 'Scroll Right'}
              title={isAr ? 'تحريك لليمين' : 'Scroll Right'}
            >
              <ChevronRight className="size-5 sm:size-6" />
            </button>

            <div
              ref={bestsellersSliderRef}
              className="flex items-stretch gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x scroll-smooth"
            >
              {displayedProducts.map((p, i) => (
                <div key={p.id} className="w-[240px] sm:w-[270px] md:w-[290px] shrink-0 snap-start flex">
                  <ProductCard product={p} index={i} />
                </div>
              ))}

              {/* Discover More Card in Slider */}
              <div className="w-[200px] sm:w-[240px] shrink-0 snap-start flex">
                <Link
                  href="/shop"
                  className="flex flex-col items-center justify-center text-center p-6 w-full h-full rounded-3xl border border-dashed border-white/15 hover:border-[#D4A5A5] bg-[#141414]/50 hover:bg-[#141414] transition group"
                >
                  <div className="size-12 rounded-full bg-[#D4A5A5]/10 text-[#D4A5A5] flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <ShoppingBag className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-[#D4A5A5] transition">
                    {isAr ? 'عرض جميع المنتجات' : 'View All Products'}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    {isAr ? 'اكتشفي المزيد ←' : 'Discover More →'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0D0D0D] p-8 md:p-12 text-center shadow-xl">
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#D4A5A5]/10 rounded-full blur-3xl" />
            <div className="relative max-w-md mx-auto space-y-4">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#D4A5A5]/15 text-[#D4A5A5] border border-[#D4A5A5]/30 shadow-md">
                <Construction className="size-7 text-[#D4A5A5]" />
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-white">
                {isAr ? 'تشكيلة ROMA الحصرية الجديدة قيد الإضافة' : 'New Exclusive ROMA Collection Coming Soon'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {isAr
                  ? 'يتم تحديث وإضافة أحدث مستحضرات التجميل والعناية الفاخرة تباعاً. يمكنكِ الاستفسار وطلب أي منتج مباشرة عبر واتساب.'
                  : 'Our atelier is curating the finest luxury beauty formulas. Inquire and place your custom order directly via WhatsApp.'}
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/201505566849"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A5A5] to-[#C89595] text-[#0A0A0A] font-bold text-xs sm:text-sm shadow-lg shadow-[#D4A5A5]/10 hover:brightness-110 active:scale-95 transition"
                >
                  <MessageCircle className="size-4" />
                  <span>{isAr ? 'طلب واستفسار عبر واتساب (01505566849)' : 'Order via WhatsApp (+201505566849)'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Under 10 EGP Section - قسم منتجات تحت 10 جنيه */}
      {under10Products.length > 0 && (
        <section id="under-10-section" className="roma-container scroll-mt-24">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs md:text-sm font-semibold text-rose-400 flex items-center gap-1.5">
                  <Flame className="size-3.5 text-rose-400 animate-pulse" />
                  <span>{isAr ? 'عروض التوفير الخارقة' : 'Super Saver Deals'}</span>
                </span>

                {/* Live Countdown Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px] font-mono font-bold shadow-xs">
                  <Timer className="size-3 text-rose-400 animate-pulse" />
                  <span>{isAr ? 'ينتهي العرض خلال:' : 'Ends in:'}</span>
                  <span className="text-white bg-black/60 px-1 py-0.2 rounded border border-rose-500/20">{timeLeft.days}d</span>:
                  <span className="text-white bg-black/60 px-1 py-0.2 rounded border border-rose-500/20">{timeLeft.hours}h</span>:
                  <span className="text-white bg-black/60 px-1 py-0.2 rounded border border-rose-500/20">{timeLeft.minutes}m</span>:
                  <span className="text-white bg-black/60 px-1 py-0.2 rounded border border-rose-500/20">{timeLeft.seconds}s</span>
                </div>
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-1.5 leading-snug">
                {t('section.under_10_title')}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {t('section.under_10_subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              {/* Quick Header Arrow Controls */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 bg-[#141414] border border-rose-500/20 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleScroll(under10SliderRef, 'right')}
                  className="size-8 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-rose-300 hover:text-white transition active:scale-90"
                  aria-label={isAr ? 'تحريك لليمين' : 'Scroll Right'}
                  title={isAr ? 'تحريك لليمين' : 'Scroll Right'}
                >
                  <ChevronRight className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll(under10SliderRef, 'left')}
                  className="size-8 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-rose-300 hover:text-white transition active:scale-90"
                  aria-label={isAr ? 'تحريك لليسار' : 'Scroll Left'}
                  title={isAr ? 'تحريك لليسار' : 'Scroll Left'}
                >
                  <ChevronLeft className="size-4" />
                </button>
              </div>

              <Link
                href="/shop?maxPrice=10"
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-white px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all duration-300"
              >
                <span>{isAr ? 'عرض جميع العروض' : 'View All Deals'}</span>
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1 rtl:rotate-0 ltr:rotate-180" />
              </Link>
            </div>
          </div>

          {/* Under 10 Products Smooth Slider with Floating Side Arrows */}
          <div className="relative group/slider">
            {/* Floating Left Button (زر تحريك يسار بجوار المنتجات) */}
            <button
              type="button"
              onClick={() => handleScroll(under10SliderRef, 'left')}
              className="absolute left-1 sm:left-2 md:-left-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-[#121212]/90 hover:bg-rose-500 text-white hover:text-white border border-rose-500/30 hover:border-rose-400 shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:shadow-[0_0_24px_rgba(244,63,94,0.5)] backdrop-blur-md transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 select-none"
              aria-label={isAr ? 'تحريك لليسار' : 'Scroll Left'}
              title={isAr ? 'تحريك لليسار' : 'Scroll Left'}
            >
              <ChevronLeft className="size-5 sm:size-6" />
            </button>

            {/* Floating Right Button (زر تحريك يمين بجوار المنتجات) */}
            <button
              type="button"
              onClick={() => handleScroll(under10SliderRef, 'right')}
              className="absolute right-1 sm:right-2 md:-right-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-[#121212]/90 hover:bg-rose-500 text-white hover:text-white border border-rose-500/30 hover:border-rose-400 shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:shadow-[0_0_24px_rgba(244,63,94,0.5)] backdrop-blur-md transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 select-none"
              aria-label={isAr ? 'تحريك لليمين' : 'Scroll Right'}
              title={isAr ? 'تحريك لليمين' : 'Scroll Right'}
            >
              <ChevronRight className="size-5 sm:size-6" />
            </button>

            <div
              ref={under10SliderRef}
              className="flex items-stretch gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x scroll-smooth"
            >
              {under10Products.map((p, i) => (
                <div key={p.id} className="w-[240px] sm:w-[270px] md:w-[290px] shrink-0 snap-start flex">
                  <ProductCard product={p} index={i} />
                </div>
              ))}

              {/* Discover More Card in Under 10 Slider */}
              <div className="w-[200px] sm:w-[240px] shrink-0 snap-start flex">
                <Link
                  href="/shop"
                  className="flex flex-col items-center justify-center text-center p-6 w-full h-full rounded-3xl border border-dashed border-rose-500/20 hover:border-rose-400 bg-[#141414]/50 hover:bg-[#141414] transition group"
                >
                  <div className="size-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <Flame className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-rose-400 transition">
                    {isAr ? 'تصفح كل عروض المتجر' : 'Browse All Deals'}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    {isAr ? 'اكتشفي المزيد ←' : 'Discover More →'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Client Testimonials & Social Proof - Elevated Luxury with Micro-Animations */}
      <section className="roma-container">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141414] via-[#0E0E0E] to-[#121212] p-8 md:p-14 shadow-2xl">
          {/* Ambient soft glow backdrop */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4A5A5]/10 rounded-full blur-3xl" />

          <div className="relative text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#D4A5A5]/10 border border-[#D4A5A5]/25 text-[#D4A5A5] text-xs font-semibold mb-3 shadow-xs">
              <BadgeCheck className="size-4 text-[#D4A5A5]" />
              <span>{isAr ? 'شهادات عميلاتنا الموثقة' : 'Verified Client Reviews'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1 leading-snug">
              {isAr ? 'ماذا تقول جميلات ROMA عنا؟' : 'Cherished Experiences'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-normal leading-relaxed">
              {isAr ? 'ثقة وتجارب حقيقية تعكس رقي وجودة مستحضراتنا الملكية' : 'Authentic reflections of luxury, purity and care'}
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {TESTIMONIALS.map((tItem) => (
              <div
                key={tItem.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 hover:border-[#D4A5A5]/50 bg-[#161616]/90 backdrop-blur-md p-6 sm:p-7 md:p-8 shadow-xl hover:shadow-2xl hover:shadow-[#D4A5A5]/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Floating Quote Icon Watermark */}
                <Quote className="absolute top-4 left-4 size-16 text-white/[0.03] group-hover:text-[#D4A5A5]/[0.08] transition-all duration-500 pointer-events-none -rotate-12" />

                <div>
                  {/* Rating Stars & Verified Pill */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="flex text-[#D4A5A5] gap-1 drop-shadow-[0_0_6px_rgba(212,165,165,0.4)]">
                      {Array.from({ length: tItem.rating }).map((_, i) => (
                        <Star key={i} className="size-4 fill-[#D4A5A5] transition-transform duration-300 group-hover:scale-110" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      <CheckCircle2 className="size-3 text-emerald-400" />
                      <span>{isAr ? 'مشتري موثق' : 'Verified'}</span>
                    </span>
                  </div>

                  {/* Review Quote with Refined Arabic Typography */}
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal italic relative z-10">
                    "{isAr ? tItem.quoteAr : tItem.quoteEn}"
                  </p>
                </div>

                {/* Author Signature & City */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                  <div className="flex size-9 rounded-full bg-gradient-to-tr from-[#D4A5A5]/20 to-[#D4A5A5]/10 border border-[#D4A5A5]/30 items-center justify-center font-bold text-xs text-[#D4A5A5] shrink-0">
                    {tItem.nameAr.charAt(0)}
                  </div>
                  <div className="flex flex-col text-right">
                    <strong className="text-xs sm:text-sm font-bold text-white tracking-wide group-hover:text-[#D4A5A5] transition-colors">
                      {isAr ? tItem.nameAr.split('—')[0]?.trim() : tItem.nameEn.split('—')[0]?.trim()}
                    </strong>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {isAr ? tItem.nameAr.split('—')[1]?.trim() : tItem.nameEn.split('—')[1]?.trim()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}