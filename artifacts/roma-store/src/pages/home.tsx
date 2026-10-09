import { Crown, Star, ShoppingBag, Sparkles, Quote, CheckCircle2, MessageCircle, ArrowLeft, ArrowRight, Boxes, Construction, BadgeCheck, Flame, ChevronLeft, ChevronRight, Timer, ShieldCheck, Truck, Gem, Camera, ZoomIn, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/product-card';
import { CATEGORIES, TESTIMONIALS, useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';

const HERO_SHOWCASE_IMAGES = [
  {
    src: '/hero/banner-1.png',
    alt: 'تخفيضات كبرى في روما مصر - أكبر سوق للمكياج في مصر - خصومات تصل إلى 50%',
    link: '/shop',
  },
  {
    src: '/hero/banner-2.png',
    alt: 'انتعاش العطر في هذا الصيف - تشكيلة فاخرة بروائح زهرية بخصم حتى 15%',
    link: '/shop?category=perfumes',
  },
  {
    src: '/hero/banner-3.png',
    alt: 'عروض حصرية وبداية الشتاء - أسعار تبدأ من 1 جنيه مصري',
    link: '/shop',
  },
];

export default function Home() {
  const { t, isAr, dir } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [[currentHeroImageIdx, direction], setSlide] = useState([0, 0]);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [previewReviewImage, setPreviewReviewImage] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const paginate = (newDirection: number) => {
    setSlide(([prev]) => [
      (prev + newDirection + HERO_SHOWCASE_IMAGES.length) % HERO_SHOWCASE_IMAGES.length,
      newDirection,
    ]);
  };

  const goToSlide = (idx: number) => {
    setSlide(([prev]) => [idx, idx > prev ? 1 : -1]);
  };

  // Auto-switch hero showcase image every 3 seconds (pauses on hover or touch)
  useEffect(() => {
    if (isHeroHovered) return;
    const heroTimer = setInterval(() => {
      paginate(1);
    }, 3000);
    return () => clearInterval(heroTimer);
  }, [isHeroHovered]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
    isDraggingRef.current = false;
    setIsHeroHovered(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
    if (touchStartXRef.current !== null && Math.abs(touchStartXRef.current - e.touches[0].clientX) > 10) {
      isDraggingRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    setIsHeroHovered(false);
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      if (Math.abs(diff) > 35) {
        if (diff > 0) {
          paginate(1);
        } else {
          paginate(-1);
        }
      }
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Cinematic Luxury Parallax & Depth Transition
  const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;
  const bannerVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? (isAr ? '-20%' : '20%') : (isAr ? '20%' : '-20%'),
      opacity: 0,
      scale: 1.04,
      filter: 'blur(3px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { duration: 0.65, ease: LUXURY_EASE },
        opacity: { duration: 0.45, ease: 'easeOut' as const },
        scale: { duration: 0.7, ease: LUXURY_EASE },
        filter: { duration: 0.35 },
      },
    },
    exit: (dir: number) => ({
      x: dir >= 0 ? (isAr ? '20%' : '-20%') : (isAr ? '-20%' : '20%'),
      opacity: 0,
      scale: 0.97,
      filter: 'blur(3px)',
      transition: {
        x: { duration: 0.55, ease: LUXURY_EASE },
        opacity: { duration: 0.35, ease: 'easeIn' as const },
        scale: { duration: 0.55 },
        filter: { duration: 0.3 },
      },
    }),
  };

  // Testimonial Carousel State & Gestures (Mobile Auto-sliding with Swipe)
  const [[currentTestimonialIdx, testimonialDirection], setTestimonialSlide] = useState([0, 0]);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);
  const testimonialTouchStartXRef = useRef<number | null>(null);
  const testimonialTouchEndXRef = useRef<number | null>(null);
  const isTestimonialDraggingRef = useRef(false);

  const paginateTestimonial = (newDirection: number) => {
    setTestimonialSlide(([prev]) => [
      (prev + newDirection + TESTIMONIALS.length) % TESTIMONIALS.length,
      newDirection,
    ]);
  };

  const goToTestimonial = (idx: number) => {
    setTestimonialSlide(([prev]) => [idx, idx > prev ? 1 : -1]);
  };

  // Auto-switch mobile testimonials every 3.5 seconds (pauses on hover or touch)
  useEffect(() => {
    if (isTestimonialHovered) return;
    const testimonialTimer = setInterval(() => {
      paginateTestimonial(1);
    }, 3500);
    return () => clearInterval(testimonialTimer);
  }, [isTestimonialHovered]);

  const handleTestimonialTouchStart = (e: React.TouchEvent) => {
    testimonialTouchStartXRef.current = e.touches[0].clientX;
    testimonialTouchEndXRef.current = null;
    isTestimonialDraggingRef.current = false;
    setIsTestimonialHovered(true);
  };

  const handleTestimonialTouchMove = (e: React.TouchEvent) => {
    testimonialTouchEndXRef.current = e.touches[0].clientX;
    if (testimonialTouchStartXRef.current !== null && Math.abs(testimonialTouchStartXRef.current - e.touches[0].clientX) > 10) {
      isTestimonialDraggingRef.current = true;
    }
  };

  const handleTestimonialTouchEnd = () => {
    setIsTestimonialHovered(false);
    if (testimonialTouchStartXRef.current !== null && testimonialTouchEndXRef.current !== null) {
      const diff = testimonialTouchStartXRef.current - testimonialTouchEndXRef.current;
      if (Math.abs(diff) > 35) {
        if (diff > 0) {
          paginateTestimonial(1);
        } else {
          paginateTestimonial(-1);
        }
      }
    }
    setTimeout(() => {
      isTestimonialDraggingRef.current = false;
    }, 60);
    testimonialTouchStartXRef.current = null;
    testimonialTouchEndXRef.current = null;
  };

  const testimonialVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? (isAr ? '-30%' : '30%') : (isAr ? '30%' : '-30%'),
      opacity: 0,
      scale: 0.95,
      filter: 'blur(2px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { duration: 0.55, ease: LUXURY_EASE },
        opacity: { duration: 0.4, ease: 'easeOut' as const },
        scale: { duration: 0.55, ease: LUXURY_EASE },
        filter: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: dir >= 0 ? (isAr ? '30%' : '-30%') : (isAr ? '-30%' : '30%'),
      opacity: 0,
      scale: 0.95,
      filter: 'blur(2px)',
      transition: {
        x: { duration: 0.5, ease: LUXURY_EASE },
        opacity: { duration: 0.3, ease: 'easeIn' as const },
        scale: { duration: 0.5 },
        filter: { duration: 0.25 },
      },
    }),
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
    <div dir={dir} className="space-y-8 md:space-y-12 py-3 md:py-5 text-[#F9FAFB]">

      {/* ========================================================================= */}
      {/* LUXURY HERO BANNER CAROUSEL (RESPONSIVE & PEEK-OPTIMIZED)                 */}
      {/* ========================================================================= */}
      <section className="roma-container relative">
        <div
          onMouseEnter={() => setIsHeroHovered(true)}
          onMouseLeave={() => setIsHeroHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="group relative w-full max-w-[920px] mx-auto aspect-[860/355] rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-[#121212] shadow-xl md:shadow-2xl select-none"
        >
          {/* Entire banner is a link to the shop / category */}
          <Link
            href={HERO_SHOWCASE_IMAGES[currentHeroImageIdx].link}
            onClick={(e) => {
              if (isDraggingRef.current) {
                e.preventDefault();
              }
            }}
            className="block w-full h-full relative cursor-pointer overflow-hidden"
            aria-label={HERO_SHOWCASE_IMAGES[currentHeroImageIdx].alt}
          >
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={currentHeroImageIdx}
                custom={direction}
                variants={bannerVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full overflow-hidden"
              >
                <img
                  src={HERO_SHOWCASE_IMAGES[currentHeroImageIdx].src}
                  alt={HERO_SHOWCASE_IMAGES[currentHeroImageIdx].alt}
                  className="w-full h-full object-cover select-none pointer-events-none rounded-2xl md:rounded-3xl"
                  loading={currentHeroImageIdx === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {/* Subtle luxury edge highlight */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl md:rounded-3xl z-10" />
          </Link>

          {/* Sleek Glassmorphic Pagination Indicators (Mobile-optimized tap targets & styling) */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/55 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/15 shadow-xl">
            {HERO_SHOWCASE_IMAGES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-400 rounded-full cursor-pointer p-0.5 ${
                  idx === currentHeroImageIdx
                    ? 'w-6 sm:w-7 h-1.5 bg-gradient-to-r from-[#D4A5A5] to-rose-300 shadow-[0_0_8px_rgba(212,165,165,0.8)]'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
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

        <div className="mb-4 sm:mb-6 flex items-center justify-between relative z-10">
          <div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1 leading-snug">
              {t('section.categories_title')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 relative z-10">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-1.5 sm:p-3.5 shadow-md hover:border-[#D4A5A5]/60 hover:shadow-[0_16px_36px_-8px_rgba(212,165,165,0.25)] hover:-translate-y-2.5 transition-all duration-500 ease-out text-center flex flex-col justify-between active:scale-95 cursor-pointer ${
                idx >= 4 ? 'hidden sm:flex' : 'flex'
              }`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Shimmer Light Reflection on Hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-20" />

              {/* Image Container with seamless light background matching user photos */}
              <div className="aspect-square w-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden mb-1.5 sm:mb-2.5 bg-[#EBEBEB] relative shadow-inner border border-black/5">
                <img
                  src={cat.imageUrl}
                  alt={isAr ? cat.nameAr : cat.nameEn}
                  loading="lazy"
                  className="h-full w-full object-contain p-1 sm:p-1.5 transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              {/* Title & Micro-indicator */}
              <div className="pt-0.5">
                <h3 className="text-[10px] sm:text-[13px] font-bold text-zinc-100 group-hover:text-[#D4A5A5] transition-colors duration-300 line-clamp-1 leading-tight sm:leading-snug">
                  {isAr ? cat.nameAr : cat.nameEn}
                </h3>
                <div className="hidden sm:flex items-center justify-center gap-1 mt-1 text-[10px] font-semibold text-[#D4A5A5] opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300">
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
        {/* Header Row: Title & Subtitle on Right, Controls on Left */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-1.5 leading-snug">
              {t('section.bestsellers_title')}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {t('section.bestsellers_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
          </div>
        </div>

        {/* Product Cards Smooth Slider with Floating Side Arrows (Desktop only) */}
        {displayedProducts.length > 0 ? (
          <div className="relative group/slider">
            {/* Floating Left Button (Desktop only) */}
            <button
              type="button"
              onClick={() => handleScroll(bestsellersSliderRef, 'left')}
              className="hidden md:flex absolute left-1 sm:left-2 md:-left-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-[#121212]/90 hover:bg-[#D4A5A5] text-white hover:text-[#0A0A0A] border border-white/20 hover:border-[#D4A5A5] shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:shadow-[0_0_24px_rgba(212,165,165,0.5)] backdrop-blur-md transition-all duration-300 items-center justify-center cursor-pointer active:scale-90 select-none"
              aria-label={isAr ? 'تحريك لليسار' : 'Scroll Left'}
              title={isAr ? 'تحريك لليسار' : 'Scroll Left'}
            >
              <ChevronLeft className="size-5 sm:size-6" />
            </button>

            {/* Floating Right Button (Desktop only) */}
            <button
              type="button"
              onClick={() => handleScroll(bestsellersSliderRef, 'right')}
              className="hidden md:flex absolute right-1 sm:right-2 md:-right-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-[#121212]/90 hover:bg-[#D4A5A5] text-white hover:text-[#0A0A0A] border border-white/20 hover:border-[#D4A5A5] shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:shadow-[0_0_24px_rgba(212,165,165,0.5)] backdrop-blur-md transition-all duration-300 items-center justify-center cursor-pointer active:scale-90 select-none"
              aria-label={isAr ? 'تحريك لليمين' : 'Scroll Right'}
              title={isAr ? 'تحريك لليمين' : 'Scroll Right'}
            >
              <ChevronRight className="size-5 sm:size-6" />
            </button>

            <div
              ref={bestsellersSliderRef}
              className="flex items-stretch gap-3.5 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 pb-5 -mx-4 px-8 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth touch-pan-x"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
              }}
            >
              {displayedProducts.map((p, i) => (
                <div key={p.id} className="w-[76vw] max-w-[270px] sm:w-[270px] md:w-[290px] shrink-0 snap-center md:snap-start flex">
                  <ProductCard product={p} index={i} />
                </div>
              ))}

              {/* Discover More Card in Slider */}
              <div className="w-[65vw] max-w-[240px] sm:w-[240px] shrink-0 snap-center md:snap-start flex">
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
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-1.5 leading-snug">
                {t('section.under_10_title')}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {t('section.under_10_subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <Link
                href="/shop?maxPrice=10"
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-[#0A0A0A] px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border border-amber-500/30 transition-all duration-300 shadow-xs hover:shadow-amber-500/20"
              >
                <span>{isAr ? 'عرض جميع العروض' : 'View All Deals'}</span>
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1 rtl:rotate-0 ltr:rotate-180" />
              </Link>
            </div>
          </div>

          {/* Under 10 Products Smooth Slider with Floating Side Arrows (Desktop only) */}
          <div className="relative group/slider">
            {/* Floating Left Button (Desktop only) */}
            <button
              type="button"
              onClick={() => handleScroll(under10SliderRef, 'left')}
              className="hidden md:flex absolute left-1 sm:left-2 md:-left-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-[#121212]/90 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 text-amber-200 hover:text-[#0A0A0A] border border-amber-500/30 hover:border-amber-400 shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:shadow-[0_0_24px_rgba(245,158,11,0.5)] backdrop-blur-md transition-all duration-300 items-center justify-center cursor-pointer active:scale-90 select-none"
              aria-label={isAr ? 'تحريك لليسار' : 'Scroll Left'}
              title={isAr ? 'تحريك لليسار' : 'Scroll Left'}
            >
              <ChevronLeft className="size-5 sm:size-6" />
            </button>

            {/* Floating Right Button (Desktop only) */}
            <button
              type="button"
              onClick={() => handleScroll(under10SliderRef, 'right')}
              className="hidden md:flex absolute right-1 sm:right-2 md:-right-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-[#121212]/90 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 text-amber-200 hover:text-[#0A0A0A] border border-amber-500/30 hover:border-amber-400 shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:shadow-[0_0_24px_rgba(245,158,11,0.5)] backdrop-blur-md transition-all duration-300 items-center justify-center cursor-pointer active:scale-90 select-none"
              aria-label={isAr ? 'تحريك لليمين' : 'Scroll Right'}
              title={isAr ? 'تحريك لليمين' : 'Scroll Right'}
            >
              <ChevronRight className="size-5 sm:size-6" />
            </button>

            <div
              ref={under10SliderRef}
              className="flex items-stretch gap-3.5 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 pb-5 -mx-4 px-8 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth touch-pan-x"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
              }}
            >
              {under10Products.map((p, i) => (
                <div key={p.id} className="w-[76vw] max-w-[270px] sm:w-[270px] md:w-[290px] shrink-0 snap-center md:snap-start flex">
                  <ProductCard product={p} index={i} />
                </div>
              ))}

              {/* Discover More Card in Under 10 Slider */}
              <div className="w-[65vw] max-w-[240px] sm:w-[240px] shrink-0 snap-center md:snap-start flex">
                <Link
                  href="/shop"
                  className="flex flex-col items-center justify-center text-center p-6 w-full h-full rounded-3xl border border-dashed border-amber-500/25 hover:border-amber-400 bg-[#141414]/50 hover:bg-[#141414] transition group"
                >
                  <div className="size-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <Flame className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
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
      {/* Client Testimonials & Social Proof - Elevated Luxury with Real Customer Photos */}
      <section className="roma-container">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141414] via-[#0E0E0E] to-[#121212] p-5 sm:p-8 md:p-12 shadow-2xl">
          {/* Ambient soft glow backdrop */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4A5A5]/10 rounded-full blur-3xl" />

          <div className="relative text-center max-w-xl mx-auto mb-7 md:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#D4A5A5]/10 border border-[#D4A5A5]/25 text-[#D4A5A5] text-xs font-semibold mb-3 shadow-xs">
              <Camera className="size-3.5 text-[#D4A5A5]" />
              <span>{isAr ? 'تصوير وتقييمات حقيقية' : 'Real Customer Reviews & Photos'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1 leading-snug">
              {isAr ? 'تجارب عميلاتنا وصور المنتجات على الطبيعة' : 'Customer Unboxings & Real Photos'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-normal leading-relaxed">
              {isAr ? 'صور وتجارب واقعية شاركتها معنا عميلات روما بعد الاستلام والتجربة' : 'Authentic photos shared by our customers after receiving their orders'}
            </p>
          </div>

          {/* Mobile Testimonials Animated Carousel (Swipe & Controls) */}
          <div
            className="block md:hidden relative select-none"
            onMouseEnter={() => setIsTestimonialHovered(true)}
            onMouseLeave={() => setIsTestimonialHovered(false)}
            onTouchStart={handleTestimonialTouchStart}
            onTouchMove={handleTestimonialTouchMove}
            onTouchEnd={handleTestimonialTouchEnd}
          >
            <div className="relative min-h-[360px] overflow-hidden rounded-2xl">
              <AnimatePresence mode="popLayout" custom={testimonialDirection} initial={false}>
                <motion.div
                  key={currentTestimonialIdx}
                  custom={testimonialDirection}
                  variants={testimonialVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full"
                >
                  <div className="group relative flex flex-col justify-between rounded-2xl border border-white/10 hover:border-[#D4A5A5]/40 bg-[#161616]/95 backdrop-blur-md p-4 sm:p-5 shadow-xl overflow-hidden">
                    {/* Header: User Info & Verification */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-9 rounded-full bg-gradient-to-tr from-[#D4A5A5]/25 to-[#D4A5A5]/10 border border-[#D4A5A5]/35 items-center justify-center font-bold text-xs text-[#D4A5A5] shrink-0">
                            {TESTIMONIALS[currentTestimonialIdx].nameAr.charAt(0)}
                          </div>
                          <div className="flex flex-col text-right">
                            <strong className="text-xs font-bold text-white tracking-wide">
                              {isAr ? TESTIMONIALS[currentTestimonialIdx].nameAr.split('—')[0]?.trim() : TESTIMONIALS[currentTestimonialIdx].nameEn.split('—')[0]?.trim()}
                            </strong>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {isAr ? TESTIMONIALS[currentTestimonialIdx].nameAr.split('—')[1]?.trim() : TESTIMONIALS[currentTestimonialIdx].nameEn.split('—')[1]?.trim()} • {isAr ? (TESTIMONIALS[currentTestimonialIdx] as any).dateAr : (TESTIMONIALS[currentTestimonialIdx] as any).dateEn}
                            </span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                          <span>{isAr ? 'شراء موثق' : 'Verified'}</span>
                        </span>
                      </div>

                      {/* Stars & Product Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex text-[#D4A5A5] gap-0.5">
                          {Array.from({ length: TESTIMONIALS[currentTestimonialIdx].rating }).map((_, i) => (
                            <Star key={i} className="size-3.5 fill-[#D4A5A5]" />
                          ))}
                        </div>
                        {(TESTIMONIALS[currentTestimonialIdx] as any).productNameAr && (
                          <span className="text-[10px] text-[#D4A5A5] bg-[#D4A5A5]/10 border border-[#D4A5A5]/20 px-2 py-0.5 rounded-md font-medium truncate max-w-[170px]">
                            {isAr ? (TESTIMONIALS[currentTestimonialIdx] as any).productNameAr : (TESTIMONIALS[currentTestimonialIdx] as any).productNameEn}
                          </span>
                        )}
                      </div>

                      {/* Review Quote Text - Natural & Conversational */}
                      <p className="text-[13px] text-[#FFF7EC] leading-[1.75] font-normal text-right mb-3.5">
                        {isAr ? TESTIMONIALS[currentTestimonialIdx].quoteAr : TESTIMONIALS[currentTestimonialIdx].quoteEn}
                      </p>
                    </div>

                    {/* Customer Real Photo Card */}
                    {(TESTIMONIALS[currentTestimonialIdx] as any).photoUrl && (
                      <div
                        onClick={() => setPreviewReviewImage((TESTIMONIALS[currentTestimonialIdx] as any).photoUrl)}
                        className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-[4/3] cursor-pointer group/photo active:scale-[0.99] transition"
                      >
                        <img
                          src={(TESTIMONIALS[currentTestimonialIdx] as any).photoUrl}
                          alt="Customer Review Photo"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-[10px] text-white/90">
                          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
                            <Camera className="size-3 text-[#D4A5A5]" />
                            <span>{isAr ? 'تصوير العميلة على الطبيعة' : 'Real Photo'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-white/80 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
                            <ZoomIn className="size-3" />
                            <span>{isAr ? 'تكبير الصورة' : 'Zoom'}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center justify-between mt-3.5 px-1">
              <button
                type="button"
                onClick={() => paginateTestimonial(-1)}
                className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-[#D4A5A5]/40 transition active:scale-95 cursor-pointer"
                aria-label={isAr ? 'التقييم السابق' : 'Previous review'}
              >
                {isAr ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </button>

              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToTestimonial(idx)}
                    aria-label={`Go to review ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      idx === currentTestimonialIdx
                        ? 'w-5 sm:w-6 h-1.5 bg-gradient-to-r from-[#D4A5A5] to-rose-300 shadow-[0_0_8px_rgba(212,165,165,0.7)]'
                        : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => paginateTestimonial(1)}
                className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-[#D4A5A5]/40 transition active:scale-95 cursor-pointer"
                aria-label={isAr ? 'التقييم التالي' : 'Next review'}
              >
                {isAr ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            </div>
          </div>

          {/* Desktop 3-column Grid */}
          <div className="relative hidden md:grid md:grid-cols-3 gap-6 md:gap-7">
            {TESTIMONIALS.map((tItem: any) => (
              <div
                key={tItem.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 hover:border-[#D4A5A5]/50 bg-[#161616]/90 backdrop-blur-md p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:shadow-[#D4A5A5]/10 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden"
              >
                <div>
                  {/* Top Header: User Info & Verification */}
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 rounded-full bg-gradient-to-tr from-[#D4A5A5]/25 to-[#D4A5A5]/10 border border-[#D4A5A5]/30 items-center justify-center font-bold text-xs text-[#D4A5A5] shrink-0">
                        {tItem.nameAr.charAt(0)}
                      </div>
                      <div className="flex flex-col text-right">
                        <strong className="text-xs sm:text-sm font-bold text-white tracking-wide group-hover:text-[#D4A5A5] transition-colors">
                          {isAr ? tItem.nameAr.split('—')[0]?.trim() : tItem.nameEn.split('—')[0]?.trim()}
                        </strong>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {isAr ? tItem.nameAr.split('—')[1]?.trim() : tItem.nameEn.split('—')[1]?.trim()} • {isAr ? tItem.dateAr : tItem.dateEn}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                      <CheckCircle2 className="size-3 text-emerald-400" />
                      <span>{isAr ? 'شراء موثق' : 'Verified'}</span>
                    </span>
                  </div>

                  {/* Stars & Product Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex text-[#D4A5A5] gap-0.5">
                      {Array.from({ length: tItem.rating }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-[#D4A5A5]" />
                      ))}
                    </div>
                    {tItem.productNameAr && (
                      <span className="text-[10px] text-[#D4A5A5] bg-[#D4A5A5]/10 border border-[#D4A5A5]/20 px-2 py-0.5 rounded-md font-medium truncate max-w-[180px]">
                        {isAr ? tItem.productNameAr : tItem.productNameEn}
                      </span>
                    )}
                  </div>

                  {/* Review Text - Natural & Conversational */}
                  <p className="text-[13px] sm:text-[14px] text-[#F3F4F6] leading-[1.8] font-normal text-right mb-4">
                    {isAr ? tItem.quoteAr : tItem.quoteEn}
                  </p>
                </div>

                {/* Customer Real Photo Card */}
                {tItem.photoUrl && (
                  <div
                    onClick={() => setPreviewReviewImage(tItem.photoUrl)}
                    className="relative rounded-xl overflow-hidden border border-white/10 group-hover:border-[#D4A5A5]/40 bg-black/40 aspect-[4/3] cursor-pointer transition-all duration-300"
                  >
                    <img
                      src={tItem.photoUrl}
                      alt={isAr ? tItem.nameAr : tItem.nameEn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-[10px] text-white/90">
                      <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
                        <Camera className="size-3 text-[#D4A5A5]" />
                        <span>{isAr ? 'تصوير العميلة على الطبيعة' : 'Real Photo'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-white/80 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
                        <ZoomIn className="size-3" />
                        <span>{isAr ? 'تكبير' : 'Zoom'}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Customer Photo Fullscreen Lightbox Modal */}
      {previewReviewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setPreviewReviewImage(null)}
        >
          <div
            className="relative max-w-sm sm:max-w-md w-full rounded-2xl overflow-hidden border border-white/20 bg-[#141414] shadow-2xl p-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewReviewImage}
              alt="Customer Review Photo"
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl bg-black"
            />
            <div className="pt-2.5 pb-1 text-center">
              <span className="text-xs text-zinc-300 font-medium">
                {isAr ? '📷 تصوير حقيقي مرسل من العميلة بعد استلام وتجربة المنتج' : '📷 Real customer unboxing photo after delivery'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewReviewImage(null)}
              className="absolute top-4 right-4 size-8 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-white hover:text-black transition cursor-pointer"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Quick Contact Button (Home Page Only) */}
      <a
        href={`https://wa.me/201505566849?text=${encodeURIComponent(
          isAr
            ? 'مرحباً روما ستور، أود الاستفسار والتواصل بخصوص المنتجات والطلبات.'
            : 'Hello ROMA Store, I would like to get in touch regarding products and orders.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isAr ? 'تواصل معنا عبر واتساب' : 'Chat via WhatsApp'}
        title={isAr ? 'تواصل معنا مباشرة عبر واتساب' : 'Chat with us on WhatsApp'}
        className="fixed bottom-[4.5rem] right-3.5 sm:bottom-6 sm:right-6 z-40 group flex items-center justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white size-11 sm:size-13 rounded-full shadow-[0_6px_24px_rgba(37,211,102,0.5)] hover:shadow-[0_8px_32px_rgba(37,211,102,0.7)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 select-none cursor-pointer"
      >
        <div className="relative flex items-center justify-center">
          <svg
            className="size-5.5 sm:size-7 fill-current text-white shrink-0 transition-transform duration-300 group-hover:scale-110"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 size-2 sm:size-2.5 rounded-full bg-emerald-200 animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 size-2 sm:size-2.5 rounded-full bg-white" />
        </div>
      </a>
    </div>
  );
}