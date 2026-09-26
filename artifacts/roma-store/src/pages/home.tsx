import { Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { ProductCard } from '@/components/product-card';
import { CATEGORIES, TESTIMONIALS, useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';

export default function Home() {
  const { t, isAr, dir } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');

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
    <div dir={dir} className="space-y-10 md:space-y-16 py-4 md:py-8 text-[#F9FAFB]">

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
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-2">
            {categoryPills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveCategory(pill.id)}
                className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-xs ${
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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