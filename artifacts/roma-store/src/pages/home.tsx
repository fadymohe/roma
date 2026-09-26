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
    { id: 'accessories', label: t('nav.accessories') },
  ];

  return (
    <div dir={dir} className="space-y-12 md:space-y-20 py-4 md:py-8">
      {/* Luxury Hero Section */}
      <section className="roma-container">
        <div className="relative overflow-hidden rounded-[36px] border border-[#EFE8DE] bg-gradient-to-br from-[#4A1525] via-[#38101C] to-[#260B13] text-[#FDFBF7] p-8 md:p-16 shadow-2xl">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-[#D48B88]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-[#E8A598]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid gap-10 md:grid-cols-12 items-center">
            {/* Left/Main Column: Copy & Actions */}
            <div className="md:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-[#E8A598] border border-white/15">
                <Sparkles className="size-3.5" />
                {t('hero.badge')}
              </span>

              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.15] tracking-tight">
                {t('hero.title_part1')}{' '}
                <span className="text-[#E8A598] underline decoration-[#D48B88]/40 decoration-wavy">
                  {t('hero.title_highlight')}
                </span>
              </h1>

              <p className="text-sm md:text-base leading-relaxed text-white/80 max-w-xl">
                {t('hero.description')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/shop"
                  className="rounded-full bg-[#D48B88] hover:bg-[#E8A598] px-7 py-3.5 text-xs md:text-sm font-bold text-[#4A1525] shadow-lg shadow-[#D48B88]/30 transition-all hover:scale-105 active:scale-95"
                >
                  {t('hero.cta_shop')}
                </Link>

                <Link
                  href="/policies"
                  className="rounded-full border border-white/30 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-xs md:text-sm font-bold text-white transition"
                >
                  {t('nav.policies')}
                </Link>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
                <div>
                  <strong className="block text-xl md:text-2xl font-extrabold text-[#E8A598] font-mono-brand">
                    100%
                  </strong>
                  <span className="text-[11px] text-white/70">{t('hero.stat_natural')}</span>
                </div>
                <div>
                  <strong className="block text-xl md:text-2xl font-extrabold text-[#E8A598] font-mono-brand">
                    24-48h
                  </strong>
                  <span className="text-[11px] text-white/70">{t('hero.stat_delivery')}</span>
                </div>
                <div>
                  <strong className="block text-xl md:text-2xl font-extrabold text-[#E8A598] font-mono-brand">
                    +15,000
                  </strong>
                  <span className="text-[11px] text-white/70">{t('hero.stat_customers')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Hero Product Spotlight */}
            {heroProduct && (
              <div className="md:col-span-5">
                <div className="relative rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-xl p-5 shadow-xl space-y-4">
                  <div className="relative aspect-square rounded-[24px] overflow-hidden bg-white/95 p-4 flex items-center justify-center">
                    <img
                      src={heroProduct.imageUrl}
                      alt={isAr ? heroProduct.nameAr : (heroProduct.nameEn || heroProduct.nameAr)}
                      className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 hover:scale-105"
                    />
                    <span className="absolute top-3 right-3 rounded-full bg-[#4A1525] px-2.5 py-1 text-[10px] font-bold text-white">
                      {isAr ? heroProduct.badge : (heroProduct.badgeEn || heroProduct.badge)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white line-clamp-1">
                        {isAr ? heroProduct.nameAr : (heroProduct.nameEn || heroProduct.nameAr)}
                      </h3>
                      <p className="text-xs text-[#E8A598] font-bold font-mono-brand">
                        {formatPrice(heroProduct.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleHeroAdd}
                      className="flex items-center gap-1.5 rounded-full bg-[#D48B88] hover:bg-[#E8A598] px-4 py-2 text-xs font-bold text-[#4A1525] shadow-xs transition active:scale-95"
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
          <div className="rounded-[28px] border border-[#EFE8DE] bg-white p-5 shadow-xs space-y-2 transition-all hover:border-[#D48B88]/50 hover:shadow-md">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#F8EBEA] text-[#4A1525]">
              <Sparkles className="size-5 text-[#D48B88]" />
            </div>
            <h3 className="font-display font-bold text-sm text-foreground">
              {t('trust.organic_title')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('trust.organic_desc')}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#EFE8DE] bg-white p-5 shadow-xs space-y-2 transition-all hover:border-[#D48B88]/50 hover:shadow-md">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#F8EBEA] text-[#4A1525]">
              <Truck className="size-5 text-[#D48B88]" />
            </div>
            <h3 className="font-display font-bold text-sm text-foreground">
              {t('trust.fast_shipping_title')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('trust.fast_shipping_desc')}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#EFE8DE] bg-white p-5 shadow-xs space-y-2 transition-all hover:border-[#D48B88]/50 hover:shadow-md">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#F8EBEA] text-[#4A1525]">
              <HeartHandshake className="size-5 text-[#D48B88]" />
            </div>
            <h3 className="font-display font-bold text-sm text-foreground">
              {t('trust.cod_title')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('trust.cod_desc')}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#EFE8DE] bg-white p-5 shadow-xs space-y-2 transition-all hover:border-[#D48B88]/50 hover:shadow-md">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#F8EBEA] text-[#4A1525]">
              <ShieldCheck className="size-5 text-[#D48B88]" />
            </div>
            <h3 className="font-display font-bold text-sm text-foreground">
              {t('trust.moh_title')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('trust.moh_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Visual Grid */}
      <section className="roma-container">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono-brand text-xs font-bold text-[#D48B88] tracking-widest uppercase">
              {isAr ? 'الأقسام والمجموعات' : 'Royal Collections'}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t('section.categories_title')}
            </h2>
          </div>
          <Link href="/shop" className="text-xs font-bold text-[#4A1525] hover:underline">
            {isAr ? 'تصفح الكل' : 'View All'}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-[24px] border border-[#EFE8DE] bg-white p-3 shadow-2xs hover:shadow-md transition text-center"
            >
              <div className="aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-[#F8EBEA]">
                <img
                  src={cat.imageUrl}
                  alt={isAr ? cat.nameAr : cat.nameEn}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-[#4A1525] transition">
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
            <span className="font-mono-brand text-xs font-bold text-[#D48B88] tracking-widest uppercase">
              {isAr ? 'المختارات الأكثر تألقاً' : 'Most Coveted Bestsellers'}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
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
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-xs ${
                  activeCategory === pill.id
                    ? 'bg-[#4A1525] text-white shadow-xs'
                    : 'bg-white border border-[#EFE8DE] text-foreground/75 hover:border-[#D48B88]'
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
        <div className="rounded-[36px] border border-[#EFE8DE] bg-[#F8EBEA]/50 p-8 md:p-14">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#D48B88] uppercase tracking-widest">
              {isAr ? 'شهادات عميلاتنا الموثقة' : 'Client Testimonials'}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-1">
              {isAr ? 'ماذا تقول جميلات ROMA عنا؟' : 'Cherished Experiences'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((tItem) => (
              <div
                key={tItem.id}
                className="rounded-[28px] border border-[#EFE8DE] bg-white p-6 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">
                    {Array.from({ length: tItem.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                    {isAr ? '✓ مشترية مؤكدة' : '✓ Verified Buyer'}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-foreground/85 leading-relaxed italic">
                  "{isAr ? tItem.quoteAr : tItem.quoteEn}"
                </p>
                <div className="pt-2 border-t border-[#EFE8DE]">
                  <strong className="text-xs font-bold text-foreground block">
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