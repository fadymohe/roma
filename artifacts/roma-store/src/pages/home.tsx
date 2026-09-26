import {
  ArrowLeft,
  ArrowRight,
  Star,
  Sparkles,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Plus,
  Check,
  CheckCircle2,
  Award,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { ProductCard } from '@/components/product-card';
import { CATEGORIES, TESTIMONIALS, useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useCart } from '@/hooks/use-cart';
import { useLanguage } from '@/lib/language-context';

export default function Home() {
  const { add } = useCart();
  const { t, isAr, formatPrice, dir } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [heroAdded, setHeroAdded] = useState(false);

  // Dynamic live products synced with Telegram Bot, falling back to rich defaults
  const liveProducts = useLiveProducts();
  const featuredProducts = liveProducts.length > 0 ? liveProducts : DEFAULT_PRODUCTS;

  // Filter products based on selected tab pill
  const displayedProducts = featuredProducts.filter((p) => {
    if (activeCategory === 'all') return true;
    const cat = (p.category || '').toLowerCase();
    if (activeCategory === 'face') return cat.includes('وجه') || cat.includes('face');
    if (activeCategory === 'serum') return cat.includes('سيروم') || cat.includes('serum');
    if (activeCategory === 'skincare') return cat.includes('عناية') || cat.includes('skin');
    if (activeCategory === 'moisturizers') return cat.includes('مرطب') || cat.includes('moisturizer');
    if (activeCategory === 'lips') return cat.includes('شفاه') || cat.includes('lip');
    if (activeCategory === 'accessories') return cat.includes('إكسسوار') || cat.includes('accessory') || cat.includes('hair');
    return true;
  });

  const heroProduct = featuredProducts[0];

  const handleHeroAdd = () => {
    if (heroProduct) {
      add(heroProduct);
      setHeroAdded(true);
      setTimeout(() => setHeroAdded(false), 1600);
    }
  };

  const categoryPills = [
    { id: 'all', label: isAr ? 'الكل' : 'All Products' },
    { id: 'serum', label: t('nav.serums') },
    { id: 'lips', label: t('nav.lips') },
    { id: 'moisturizers', label: t('nav.moisturizers') },
    { id: 'face', label: t('nav.face') },
    { id: 'skincare', label: t('nav.skincare') },
    { id: 'accessories', label: isAr ? 'إكسسوارات' : 'Accessories' },
  ];

  return (
    <div dir={dir} className="space-y-12 md:space-y-20 py-4 md:py-8 text-[#F9FAFB]">
      {/* Luxury Hero Section */}
      <section className="roma-container">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-[#141414] via-[#101010] to-[#0A0A0A] p-5 sm:p-8 md:p-14 shadow-2xl">
          {/* Subtle Ambient Decorative Circles in Dusty Rose */}
          <div className="absolute -top-24 -right-24 size-72 sm:size-96 rounded-full bg-[#D4A5A5]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 size-72 sm:size-96 rounded-full bg-[#C89595]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid gap-6 sm:gap-10 md:grid-cols-12 items-center">
            {/* Left/Main Column: Copy & Actions */}
            <div className="md:col-span-7 space-y-4 sm:space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 px-3 py-1 text-[11px] sm:text-xs font-bold text-[#D4A5A5]">
                <Sparkles className="size-3 sm:size-3.5 shrink-0" />
                <span>{t('hero.badge')}</span>
              </span>

              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-snug sm:leading-[1.15] tracking-tight text-white">
                {t('hero.title_part1')}{' '}
                <span className="text-[#D4A5A5] underline decoration-[#D4A5A5]/40 decoration-wavy">
                  {t('hero.title_highlight')}
                </span>
              </h1>

              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-[#A1A1AA] max-w-xl">
                {t('hero.description')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <Link
                  href="/shop"
                  className="rounded-xl bg-[#D4A5A5] hover:bg-[#C89595] px-6 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-bold text-[#0A0A0A] text-center shadow-lg shadow-[#D4A5A5]/20 transition-all hover:scale-105 active:scale-95"
                >
                  {t('hero.cta_shop')}
                </Link>

                <Link
                  href="/categories"
                  className="rounded-xl border border-white/10 bg-[#1A1A1A] hover:bg-white/5 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white text-center transition"
                >
                  {isAr ? 'استكشاف الأقسام' : 'Browse Categories'}
                </Link>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-5 border-t border-white/10 text-center">
                <div className="space-y-0.5">
                  <strong className="block text-base sm:text-2xl font-extrabold text-[#D4A5A5] font-mono-brand whitespace-nowrap">
                    100%
                  </strong>
                  <span className="text-[10px] sm:text-xs text-[#A1A1AA] block leading-tight">{isAr ? 'طبيعي ونقي' : 'Pure & Natural'}</span>
                </div>
                <div className="space-y-0.5">
                  <strong className="block text-base sm:text-2xl font-extrabold text-[#D4A5A5] font-mono-brand whitespace-nowrap" dir="ltr">
                    24-48h
                  </strong>
                  <span className="text-[10px] sm:text-xs text-[#A1A1AA] block leading-tight">{isAr ? 'شحن فوري' : 'Express Delivery'}</span>
                </div>
                <div className="space-y-0.5">
                  <strong className="block text-base sm:text-2xl font-extrabold text-[#D4A5A5] font-mono-brand whitespace-nowrap" dir="ltr">
                    +15,000
                  </strong>
                  <span className="text-[10px] sm:text-xs text-[#A1A1AA] block leading-tight">{isAr ? 'عميلة سعيدة' : 'Happy Clients'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Hero Product Spotlight */}
            {heroProduct && (
              <div className="md:col-span-5">
                <div className="relative rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl space-y-4">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#1A1A1A] p-4 flex items-center justify-center">
                    <img
                      src={heroProduct.imageUrl}
                      alt={isAr ? heroProduct.nameAr : (heroProduct.nameEn || heroProduct.nameAr)}
                      className="h-full w-full object-cover rounded-xl transition-transform duration-700 hover:scale-105"
                    />
                    <span className="absolute top-3 right-3 rounded-full bg-[#D4A5A5] px-2.5 py-1 text-[10px] font-bold text-[#0A0A0A] shadow-md">
                      {isAr ? heroProduct.badge : (heroProduct.badgeEn || heroProduct.badge)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white line-clamp-1">
                        {isAr ? heroProduct.nameAr : (heroProduct.nameEn || heroProduct.nameAr)}
                      </h3>
                      <p className="text-xs text-[#D4A5A5] font-bold font-mono-brand mt-0.5">
                        {formatPrice(heroProduct.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleHeroAdd}
                      className="flex items-center gap-1.5 rounded-xl bg-[#D4A5A5] hover:bg-[#C89595] px-4 py-2 text-xs font-bold text-[#0A0A0A] shadow-md transition active:scale-95"
                    >
                      {heroAdded ? (
                        <>
                          <Check className="size-4" />
                          <span>{isAr ? 'تمت الإضافة' : 'Added'}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" />
                          <span>{t('product.add_to_cart')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust & Value Pillars */}
      <section className="roma-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-sm space-y-2 transition-all hover:border-[#D4A5A5]/30">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#D4A5A5]/15 text-[#D4A5A5]">
              <Sparkles className="size-5" />
            </div>
            <h3 className="font-display font-bold text-sm text-white">
              {t('trust.organic_title')}
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              {t('trust.organic_desc')}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-sm space-y-2 transition-all hover:border-[#D4A5A5]/30">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#D4A5A5]/15 text-[#D4A5A5]">
              <Truck className="size-5" />
            </div>
            <h3 className="font-display font-bold text-sm text-white">
              {t('trust.fast_shipping_title')}
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              {t('trust.fast_shipping_desc')}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-sm space-y-2 transition-all hover:border-[#D4A5A5]/30">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#D4A5A5]/15 text-[#D4A5A5]">
              <HeartHandshake className="size-5" />
            </div>
            <h3 className="font-display font-bold text-sm text-white">
              {t('trust.cod_title')}
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              {t('trust.cod_desc')}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-sm space-y-2 transition-all hover:border-[#D4A5A5]/30">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#D4A5A5]/15 text-[#D4A5A5]">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="font-display font-bold text-sm text-white">
              {t('trust.moh_title')}
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              {t('trust.moh_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Visual Grid */}
      <section className="roma-container">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono-brand text-xs font-bold text-[#D4A5A5] tracking-widest uppercase">
              {isAr ? 'الأقسام والمجموعات' : 'Royal Collections'}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
              {t('section.categories_title')}
            </h2>
          </div>
          <Link href="/categories" className="text-xs font-bold text-[#D4A5A5] hover:underline">
            {isAr ? 'تصفح الكل' : 'View All'}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-3 shadow-xs hover:border-[#D4A5A5]/40 transition text-center"
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 bg-[#1A1A1A]">
                <img
                  src={cat.imageUrl}
                  alt={isAr ? cat.nameAr : cat.nameEn}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#D4A5A5] transition">
                {isAr ? cat.nameAr : cat.nameEn}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers & Featured Products Section */}
      <section className="roma-container">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono-brand text-xs font-bold text-[#D4A5A5] tracking-widest uppercase">
              {isAr ? 'المختارات الأكثر تألقاً' : 'Most Coveted Bestsellers'}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
              {t('section.bestsellers_title')}
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoryPills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveCategory(pill.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-xs ${
                  activeCategory === pill.id
                    ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md'
                    : 'bg-[#141414] border border-white/10 text-[#A1A1AA] hover:text-white'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {displayedProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Client Testimonials & Social Proof */}
      <section className="roma-container">
        <div className="rounded-3xl border border-white/10 bg-[#141414] p-8 md:p-14">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#D4A5A5] uppercase tracking-widest">
              {isAr ? 'شهادات عميلاتنا الموثقة' : 'Client Testimonials'}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mt-1">
              {isAr ? 'ماذا تقول جميلات ROMA عنا؟' : 'Cherished Experiences'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((tItem) => (
              <div
                key={tItem.id}
                className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {Array.from({ length: tItem.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 font-bold px-2 py-0.5 rounded-full">
                    {isAr ? '✓ مشترية مؤكدة' : '✓ Verified Buyer'}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-[#A1A1AA] leading-relaxed italic">
                  "{isAr ? tItem.quoteAr : tItem.quoteEn}"
                </p>
                <div className="pt-2 border-t border-white/5">
                  <strong className="text-xs font-bold text-white block">
                    {isAr ? tItem.nameAr : tItem.nameEn}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}