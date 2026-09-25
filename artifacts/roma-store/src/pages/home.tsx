import { ArrowLeft, ArrowUpRight, Star, Sparkles, ShieldCheck, Truck, Gift, HeartHandshake, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { useGetStorefrontSummary } from '@workspace/api-client-react';
import { ProductCard } from '@/components/product-card';
import { CATEGORIES, PRODUCTS, TESTIMONIALS } from '@/lib/catalog-data';
import { useCart } from '@/hooks/use-cart';

export default function Home() {
  const summary = useGetStorefrontSummary();
  const { add } = useCart();
  const [activeCategory, setActiveCategory] = useState('face');
  const [heroAdded, setHeroAdded] = useState(false);

  // Use API data if available, fallback gracefully to our rich catalog
  const categories = (Array.isArray(summary.data?.categories) && summary.data.categories.length > 0)
    ? summary.data.categories
    : CATEGORIES;

  const featuredProducts = (Array.isArray(summary.data?.featuredProducts) && summary.data.featuredProducts.length > 0)
    ? summary.data.featuredProducts
    : PRODUCTS;

  const testimonials = (Array.isArray(summary.data?.testimonials) && summary.data.testimonials.length > 0)
    ? summary.data.testimonials
    : TESTIMONIALS;

  // Filter products based on selected tab pill
  const displayedProducts = featuredProducts.filter((p) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'face') return p.category.includes('الوجه');
    if (activeCategory === 'serum') return p.category.includes('سيروم');
    if (activeCategory === 'moisturizers') return p.category.includes('مرطبات');
    if (activeCategory === 'lips') return p.category.includes('الشفاه');
    if (activeCategory === 'body') return p.category.includes('العطور') || p.category.includes('الجسم');
    return true;
  });

  const heroProduct = featuredProducts[0];

  const handleHeroAdd = () => {
    add(heroProduct);
    setHeroAdded(true);
    setTimeout(() => setHeroAdded(false), 1600);
  };

  const categoryPills = [
    { id: 'all', label: 'الكل (All)' },
    { id: 'face', label: 'الوجه (Face)' },
    { id: 'serum', label: 'سيروم (Serum)' },
    { id: 'moisturizers', label: 'مرطبات (Moisturizers)' },
    { id: 'lips', label: 'الشفاه (Lips)' },
    { id: 'body', label: 'العطور والجسم (Body)' },
  ];

  return (
    <div dir="rtl" className="space-y-10 md:space-y-16 py-4 md:py-6">
      {/* Top Headline & Category Pills (Directly matching Image 1 & 3) */}
      <section className="roma-container">
        <div className="max-w-2xl">
          <span className="font-mono-brand text-xs font-bold text-[#527E5F] tracking-wide">
            جمال طبيعي مستدام · Natural Care Routine
          </span>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground sm:text-5xl md:text-6xl tracking-tight leading-[1.2]">
            روتينكِ المتكامل للعناية الطبيعية
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Your complete natural care routine
          </p>
        </div>

        {/* Horizontal Category Filter Pills (From Images 1, 3, 5) */}
        <div className="mt-6 flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categoryPills.map((pill) => {
            const isActive = activeCategory === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveCategory(pill.id)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-xs md:text-sm font-bold transition-all shadow-xs active:scale-95 ${
                  isActive
                    ? 'bg-[#76A080] text-white shadow-md shadow-[#76A080]/30 scale-102'
                    : 'bg-white border border-[#DEE6E0] text-foreground/75 hover:border-[#76A080] hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Hero Showcase Card + Promo Banner Grid (Inspired by Images 1, 3, 5) */}
      <section className="roma-container">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] items-stretch">
          {/* Main Hero Card: Sage green luxury card with large product (Images 1 & 3) */}
          <div className="relative overflow-hidden rounded-[32px] bg-[#E8EFEA] dark:bg-secondary/40 p-6 md:p-8 flex flex-col justify-between shadow-xs border border-[#DEE6E0]">
            {/* Top Row: Brand & Badge */}
            <div className="flex items-center justify-between z-10">
              <span className="rounded-full bg-white/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#3B6648] shadow-xs">
                الأكثر تميزاً في روتين العناية
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                NORTHEN CARE
              </span>
            </div>

            {/* Central Product Image */}
            <div className="relative my-4 aspect-[1.1] w-full max-w-[340px] mx-auto flex items-center justify-center">
              <img
                src={heroProduct.imageUrl || "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=90"}
                alt={heroProduct.nameAr}
                className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Bottom Info: Title, Volume, Price & Circular Add Button */}
            <div className="z-10 pt-2 border-t border-[#D5E2D8]">
              <Link href={`/product/${heroProduct.slug}`} className="block group">
                <h3 className="font-display text-xl md:text-2xl font-bold text-foreground group-hover:text-[#4E7A5A] transition">
                  {heroProduct.nameAr}
                </h3>
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                50 ml / 1.7 fl oz · تركيبة ترطيب وحماية مكثفة
              </p>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-extrabold font-mono-brand text-foreground">
                    {heroProduct.price}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">ج.م</span>
                </div>

                {/* Circular Sage Green Add Button (Image 1, 3) */}
                <button
                  type="button"
                  onClick={handleHeroAdd}
                  aria-label="إضافة المنتج للسلة"
                  className={`flex size-12 items-center justify-center rounded-full text-white shadow-md transition-all active:scale-95 ${
                    heroAdded
                      ? 'bg-[#2E583A] scale-105'
                      : 'bg-[#76A080] hover:bg-[#628F6D] hover:scale-105 shadow-[#76A080]/30'
                  }`}
                >
                  {heroAdded ? (
                    <Check className="size-6 animate-in zoom-in" strokeWidth={2.5} />
                  ) : (
                    <Plus className="size-6" strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Special Offer Promo Card (Image 5) + Quick Feature Highlights */}
          <div className="flex flex-col gap-6">
            {/* Promo Banner Card with Lime-Sage Gradient (Image 5) */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#A8D86A] via-[#94C955] to-[#74AA37] p-7 text-[#1A2F13] shadow-md flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-full bg-black/15 px-3 py-1 text-xs font-bold tracking-wide text-[#1A2F13]">
                  عرض محدود · Limited Offer
                </span>
                <h3 className="mt-3 font-display text-2xl md:text-3xl font-extrabold leading-snug">
                  استمتعي بخصم حصري على طلبكِ الأول
                </h3>
                <p className="mt-1 text-xs md:text-sm font-medium text-[#223E19]/80">
                  كود خصم <strong className="rounded-full bg-white/40 px-2 py-0.5 font-mono">ROUTINE10</strong> صالح لجميع المجموعات
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-xs md:text-sm font-bold text-white transition hover:bg-neutral-800 active:scale-95 shadow-md"
                >
                  تسوقي الآن <ArrowUpRight className="size-4" />
                </Link>

                <div className="flex items-center -space-x-2">
                  <span className="size-10 rounded-full border-2 border-white bg-white/80 p-1 flex items-center justify-center shadow-xs">
                    🌿
                  </span>
                  <span className="size-10 rounded-full border-2 border-white bg-white/80 p-1 flex items-center justify-center shadow-xs">
                    💧
                  </span>
                  <span className="size-10 rounded-full border-2 border-white bg-white/80 p-1 flex items-center justify-center shadow-xs">
                    ✨
                  </span>
                </div>
              </div>
            </div>

            {/* Natural Ingredients & Guarantees Card */}
            <div className="rounded-[32px] border border-[#DEE6E0] bg-white p-6 shadow-xs flex-1 flex flex-col justify-center">
              <h4 className="font-display text-base font-bold text-foreground mb-4">
                معايير العناية الطبيعية المعتمدة
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="size-8 rounded-full bg-[#E8EFEA] text-[#4E7A5A] flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <strong className="block text-foreground">100% مكونات نقية</strong>
                    <span className="text-muted-foreground text-[11px]">خالية من البارابين والزيوت الضارة</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="size-8 rounded-full bg-[#E8EFEA] text-[#4E7A5A] flex items-center justify-center shrink-0">
                    <Truck className="size-4" />
                  </div>
                  <div>
                    <strong className="block text-foreground">شحن سريع ومجاني</strong>
                    <span className="text-muted-foreground text-[11px]">للطلبات فوق 500 ج.م لكافة المدن</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="size-8 rounded-full bg-[#E8EFEA] text-[#4E7A5A] flex items-center justify-center shrink-0">
                    <Gift className="size-4" />
                  </div>
                  <div>
                    <strong className="block text-foreground">عينات مجانية راقية</strong>
                    <span className="text-muted-foreground text-[11px]">هدية مميزة مع كل طلبية</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="size-8 rounded-full bg-[#E8EFEA] text-[#4E7A5A] flex items-center justify-center shrink-0">
                    <HeartHandshake className="size-4" />
                  </div>
                  <div>
                    <strong className="block text-foreground">ضمان الرضا التام</strong>
                    <span className="text-muted-foreground text-[11px]">دعم وتتبع على مدار الساعة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Row (Image 5 "Categories - See all") */}
      <section className="roma-container">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              التصنيفات الرئيسية
            </h2>
            <p className="text-xs text-muted-foreground">Categories</p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-[#527E5F] hover:underline flex items-center gap-1"
          >
            عرض الكل (See all) <ArrowLeft className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 md:gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group relative flex flex-col items-center rounded-[24px] border border-[#DEE6E0] bg-white p-3 text-center transition hover:border-[#76A080] hover:shadow-md"
            >
              <div className="aspect-square w-full overflow-hidden rounded-[18px] bg-[#E8EFEA]">
                <img
                  src={category.imageUrl || ''}
                  alt={category.nameAr}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-108"
                />
              </div>
              <h3 className="mt-2.5 text-xs font-bold text-foreground group-hover:text-[#4E7A5A] transition truncate w-full">
                {category.nameAr}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Product Grid Section (Image 5 "New Arrival - See all") */}
      <section className="roma-container">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              الأحدث وصولاً
            </h2>
            <p className="text-xs text-muted-foreground">New Arrival</p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-[#527E5F] hover:underline flex items-center gap-1"
          >
            عرض الكل (See all) <ArrowLeft className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
          {displayedProducts.slice(0, 8).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Botanical Brand Story Banner - Sage Green Luxury */}
      <section className="roma-container">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#24422D] via-[#2F573B] to-[#1E3826] p-8 text-white md:p-14 shadow-xl border border-white/10">
          <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Sparkles className="size-3.5 text-emerald-300" />
                فلسفة الجمال المستوحاة من الطبيعة
              </span>
              <h3 className="mt-4 font-display text-3xl font-bold leading-snug text-white md:text-5xl">
                بشرتكِ تتنفس نقاءً مع كل قطرة.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-emerald-100/80 md:text-base">
                نختار لكِ خلاصة الأعشاب والزيوت النباتية الفعالة لابتكار روتين يومي يعيد للبشرة توازنها الطبيعي ويمنحها إشراقة مخملية دائمة بدون إجهاد.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Link
                  href="/shop"
                  className="rounded-full bg-white px-7 py-3 text-xs md:text-sm font-bold text-[#24422D] shadow-lg hover:bg-neutral-100 transition active:scale-95"
                >
                  استكشفي التشكيلة الطبيعية
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center p-4">
              <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/15 bg-white/10 p-8 text-center backdrop-blur-md shadow-2xl">
                <img
                  src="/logo-transparent.png"
                  alt="Logo"
                  className="h-16 md:h-20 w-auto object-contain drop-shadow-md mb-3"
                />
                <h4 className="font-display text-base font-bold text-white">
                  عناية فائقة وتألق دائم
                </h4>
                <p className="mt-1 text-xs text-emerald-100/70">
                  تركيبات أصلية تليق بجمالكِ الطبيعي
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      {testimonials.length > 0 && (
        <section className="roma-container pb-8">
          <div className="mb-6 text-center">
            <span className="font-mono-brand text-xs font-bold tracking-widest text-[#527E5F]">
              تجارب حقيقية
            </span>
            <h2 className="mt-1 font-display text-xl md:text-3xl font-bold text-foreground">
              ماذا تقول عميلاتنا عن تجربتهن؟
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-[#DEE6E0] bg-white p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 text-amber-400 mb-2.5">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs md:text-sm leading-relaxed text-foreground/85 font-medium">
                    “{item.quote}”
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#DEE6E0]/60 text-xs font-bold text-[#527E5F]">
                  {item.name} — عميلة موثقة
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}