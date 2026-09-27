import { Star, ShoppingBag, Sparkles, Quote, CheckCircle2, MessageCircle, ArrowLeft, ArrowRight, Boxes, Construction } from 'lucide-react';
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
    if (activeCategory === 'hair-accessories') return cat.includes('شعر') || cat.includes('hair');
    if (activeCategory === 'look-accessories') return cat.includes('إطلالة') || cat.includes('اطلالة') || cat.includes('look') || cat.includes('حقيبة') || cat.includes('نظارة') || cat.includes('ساعة');
    if (activeCategory === 'jewelry') return cat.includes('مجوهرات') || cat.includes('ذهب') || cat.includes('سلسلة') || cat.includes('خاتم') || cat.includes('jewelry');
    if (activeCategory === 'makeup') return cat.includes('مكياج') || cat.includes('شفاه') || cat.includes('روج') || cat.includes('تنت') || cat.includes('makeup');
    if (activeCategory === 'body-care') return cat.includes('جسم') || cat.includes('نعومة') || cat.includes('عناية') || cat.includes('body');
    if (activeCategory === 'perfumes') return cat.includes('عطر') || cat.includes('عطور') || cat.includes('perfume');
    return cat.includes(activeCategory);
  });

  const categoryPills = [
    { id: 'all', label: isAr ? 'الكل' : 'All Products' },
    { id: 'hair-accessories', label: isAr ? 'إكسسوارات الشعر' : 'Hair Accessories' },
    { id: 'look-accessories', label: isAr ? 'إكسسوارات الإطلالة' : 'Look Accessories' },
    { id: 'jewelry', label: isAr ? 'مجوهرات اليد والعنق' : 'Jewelry' },
    { id: 'makeup', label: isAr ? 'المكياج والجمال' : 'Makeup & Beauty' },
    { id: 'body-care', label: isAr ? 'العناية والنعومة' : 'Body Care' },
    { id: 'perfumes', label: isAr ? 'العطور الفاخرة' : 'Perfumes' },
  ];

  return (
    <div dir={dir} className="space-y-10 md:space-y-16 py-4 md:py-8 text-[#F9FAFB]">

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

      {/* Bestsellers & Featured Products Section */}
      <section className="roma-container">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs md:text-sm font-semibold text-[#D4A5A5] flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#D4A5A5] animate-pulse" />
              <span>{isAr ? 'المختارات الأكثر تألقاً' : 'Most Coveted Bestsellers'}</span>
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-1.5 leading-snug">
              {t('section.bestsellers_title')}
            </h2>
          </div>

          {/* Category Filter Pills */}
          {featuredProducts.length > 0 && (
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
          )}
        </div>

        {/* Product Cards Smooth Slider / Flow or Lavish Empty State */}
        {displayedProducts.length > 0 ? (
          <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x scroll-smooth">
            {displayedProducts.map((p, i) => (
              <div key={p.id} className="w-[240px] sm:w-[270px] md:w-[290px] shrink-0 snap-start">
                <ProductCard product={p} index={i} />
              </div>
            ))}

            {/* Discover More Card in Slider */}
            <div className="w-[200px] sm:w-[240px] shrink-0 snap-start flex items-stretch">
              <Link
                href="/shop"
                className="flex flex-col items-center justify-center text-center p-6 w-full rounded-3xl border border-dashed border-white/15 hover:border-[#D4A5A5] bg-[#141414]/50 hover:bg-[#141414] transition group"
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

      {/* Client Testimonials & Social Proof - Elevated Luxury with Micro-Animations */}
      <section className="roma-container">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141414] via-[#0E0E0E] to-[#121212] p-8 md:p-14 shadow-2xl">
          {/* Ambient soft glow backdrop */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4A5A5]/10 rounded-full blur-3xl" />

          <div className="relative text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A5A5]/10 border border-[#D4A5A5]/25 text-[#D4A5A5] text-[11px] font-bold tracking-widest uppercase mb-3 shadow-xs">
              <Sparkles className="size-3 text-[#D4A5A5] animate-pulse" />
              <span>{isAr ? 'شهادات عميلاتنا الموثقة' : 'Client Testimonials'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-[#D4A5A5] tracking-tight">
              {isAr ? 'ماذا تقول جميلات ROMA عنا؟' : 'Cherished Experiences'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-medium">
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