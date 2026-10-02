import { Search, X, SlidersHorizontal, ArrowUpDown, Sparkles, Lightbulb } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { ProductCard } from '@/components/product-card';
import { CATEGORIES, useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';
import { smartSearchProducts } from '@/lib/smart-search';

export default function Shop() {
  const [wouterLocation] = useLocation();
  const { t, isAr, dir } = useLanguage();

  const getUrlCategory = () => {
    try {
      return new URLSearchParams(window.location.search).get('category') ?? '';
    } catch {
      return '';
    }
  };

  const getUrlSearch = () => {
    try {
      return new URLSearchParams(window.location.search).get('search') ?? '';
    } catch {
      return '';
    }
  };

  const getUrlMaxPrice = () => {
    try {
      const p = new URLSearchParams(window.location.search).get('maxPrice');
      return p ? Number(p) : null;
    } catch {
      return null;
    }
  };

  const [category, setCategory] = useState(getUrlCategory);
  const [search, setSearch] = useState(getUrlSearch);
  const [searchInput, setSearchInput] = useState(getUrlSearch);
  const [maxPrice, setMaxPrice] = useState<number | null>(getUrlMaxPrice);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating' | 'name-asc'>('featured');

  useEffect(() => {
    const syncFromUrl = () => {
      const urlCat = getUrlCategory();
      setCategory(urlCat);
      const urlSearch = getUrlSearch();
      if (urlSearch) {
        setSearch(urlSearch);
        setSearchInput(urlSearch);
      } else {
        setSearch('');
        setSearchInput('');
      }
      setMaxPrice(getUrlMaxPrice());
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [wouterLocation]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const url = new URL(window.location.href);
    if (newCat) {
      url.searchParams.set('category', newCat);
    } else {
      url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url.toString());
  };

  const liveProducts = useLiveProducts();
  const rawProducts = liveProducts.length > 0 ? liveProducts : DEFAULT_PRODUCTS;

  const products = useMemo(() => {
    let list = [...rawProducts];

    if (category) {
      const qCat = category.toLowerCase().trim();
      list = list.filter((p) => {
        if (!p) return false;
        const pCat = (p.category || '').toLowerCase();
        const pSlug = (p.slug || '').toLowerCase();
        const pName = (p.nameAr || '').toLowerCase();

        if (qCat === 'hair-accessories' || qCat.includes('شعر')) {
          return pCat.includes('إكسسوارات الشعر') || pCat === 'hair-accessories' || /توك|توكة|توكه|ربط(ة|ه|ات)\s*شعر|استك|طوق|شريط\s*ر(أ|ا)س|عصاب|مشبك|مشابك|شابك|كليبس|بندان|باندانا|سكرانشي|scrunch|فيونك|كلبس|بنس|هير\s*بيس|دبابيس|مشط|تاج/i.test(pName);
        }
        if (qCat === 'look-accessories' || qCat.includes('إطلالة') || qCat.includes('اطلالة')) {
          return pCat.includes('إكسسوارات الإطلالة') || pCat === 'look-accessories' || /حزام|أحزمة|احزمة|نظار|حقيب|شنط|محفظ|محافظ|ساع(ة|ه|ات)|watch|bag|handbag|crossbody|سكارف|شال|إشارب|ايشارب|كاب|قبع|إبزيم|ابزيم|بروش/i.test(pName);
        }
        if (qCat === 'jewelry' || qCat.includes('مجوهرات') || qCat.includes('عنق') || qCat.includes('يد')) {
          return (pCat.includes('مجوهرات اليد والعنق') || pCat === 'jewelry') && !/حزام|احزمة/i.test(pName) || (!/حزام|احزمة/i.test(pName) && /سلسل|سلاسل|قلاد|عقد|كولي|خاتم|خواتم|اسور|أساور|سوار|انسيال|حلق|أقراط|اقراط|خلخال|خلاخل|دلاي|زركون|لؤلؤ/i.test(pName));
        }
        if (qCat === 'makeup' || qCat.includes('مكياج') || qCat.includes('شفاه') || qCat.includes('روج')) {
          return pCat.includes('المكياج والجمال') || pCat === 'makeup' || /روج|أحمر\s*(شفاه|خدود)|احمر\s*(شفاه|خدود)|شفاه|ليب|lip|مسكر|ماسكارا|mascara|كحل|ايلاينر|آيلاينر|محدد|طلاء\s*أظافر|مانيكير|اظافر|أظافر|بلاشر|بلش|مورد|كونسيلر|فاونديشن|كريم\s*اساس|بودر|ايشادو|ظلال|هايلايتر|كونتور|برايمر|مكياج|makeup|فرش\s*مكياج|بيوتي\s*بلندر|منظم\s*مكياج|رموش|يولو|توب\s*كوت|بيس\s*شيلد|شيجلام|sheglam/i.test(pName);
        }
        if (qCat === 'body-care' || qCat.includes('جسم') || qCat.includes('نعومة') || qCat.includes('بشرة') || qCat.includes('عناية')) {
          return pCat.includes('العناية بالجسم') || pCat === 'body-care' || (!/توك|حزام|سلسل|روج|عطر/i.test(pName) && /لوشن|مرطب|كريم|غسول|سيروم|زيت|مقشر|سكراب|صابون|شاور|ماسك|قناع|فازلين|مزيل\s*عرق|ديودورنت|جل\s*الصبار|واقي\s*شمس|صن\s*بلوك|شامبو|بلسم|عناية/i.test(pName));
        }
        if (qCat === 'perfumes' || qCat.includes('عطر') || qCat.includes('عطور')) {
          return pCat.includes('العطور الفاخرة') || pCat === 'perfumes' || /عطر|عطور|برفان|بارفيوم|parfum|perfume|مسك|عود|بخور|كولونيا|او\s*(دي|دو)|eau\s*d|بودي\s*ميست|رذاذ/i.test(pName);
        }

        return pCat.includes(qCat) || pSlug.includes(qCat);
      });
    }

    if (typeof maxPrice === 'number' && maxPrice > 0) {
      list = list.filter((p) => typeof p.price === 'number' && p.price <= maxPrice);
    }

    if (search.trim()) {
      const summary = smartSearchProducts(list, search);
      list = summary.results;
    }

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
    }

    return list;
  }, [rawProducts, category, search, maxPrice, sortBy]);

  const searchSummary = useMemo(() => {
    if (!search.trim()) return null;
    return smartSearchProducts(rawProducts, search);
  }, [rawProducts, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    const url = new URL(window.location.href);
    if (searchInput.trim()) {
      url.searchParams.set('search', searchInput.trim());
    } else {
      url.searchParams.delete('search');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchInput('');
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    window.history.pushState({}, '', url.toString());
  };

  const categoryFilters = [
    { id: '', label: isAr ? 'جميع المنتجات' : 'All Products' },
    { id: 'hair-accessories', label: isAr ? 'إكسسوارات الشعر' : 'Hair Accessories' },
    { id: 'look-accessories', label: isAr ? 'إكسسوارات الإطلالة' : 'Look Accessories' },
    { id: 'jewelry', label: isAr ? 'مجوهرات اليد والعنق' : 'Jewelry' },
    { id: 'makeup', label: isAr ? 'المكياج والجمال' : 'Makeup & Beauty' },
    { id: 'body-care', label: isAr ? 'العناية بالجسم والنعومة' : 'Body Care' },
    { id: 'perfumes', label: isAr ? 'العطور الفاخرة' : 'Perfumes' },
  ];

  return (
    <div className="roma-container py-8 md:py-12 text-[#F9FAFB]" dir={dir}>
      {/* Header & Subtitle */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white">
          {t('nav.shop')}
        </h1>
        <p className="mt-2 text-xs md:text-sm text-[#A1A1AA] max-w-xl">
          {isAr
            ? 'تصفحي جميع مستحضراتنا الطبيعية الفاخرة وإكسسواراتنا الحصرية المعززة بأنقى الخلاصات.'
            : 'Explore our complete atelier of pure botanical formulations and handcrafted women\'s accessories.'}
        </p>
      </div>

      {/* Filter and Search Section */}
      <div className="mb-8 space-y-4 border-b border-white/10 pb-6">
        {/* Category Filter Pills - Full width flex-wrap to ensure every category is completely visible */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {categoryFilters.map((f) => {
            const active = category === f.id;
            return (
              <button
                type="button"
                key={f.id}
                onClick={() => handleCategoryChange(f.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 ${
                  active
                    ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md ring-2 ring-[#D4A5A5]/40'
                    : 'bg-[#141414] border border-white/10 text-[#A1A1AA] hover:text-white hover:border-white/20'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Active Price Filter Pill if applied */}
        {maxPrice !== null && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-zinc-400">{isAr ? 'فلتر السعر النشط:' : 'Active price filter:'}</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold shadow-xs">
              <span>{isAr ? `عروض أقل من ${maxPrice} ج.م` : `Deals under ${maxPrice} EGP`}</span>
              <button
                type="button"
                onClick={() => {
                  setMaxPrice(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete('maxPrice');
                  window.history.pushState({}, '', url.toString());
                }}
                className="hover:text-white p-0.5 rounded-full hover:bg-rose-500/30 transition cursor-pointer"
                title={isAr ? 'إلغاء الفلتر' : 'Remove filter'}
              >
                <X className="size-3" />
              </button>
            </span>
          </div>
        )}

        {/* Search & Sort Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-zinc-400 font-medium">
            {isAr ? (
              <span>إجمالي المعروض: <strong className="text-white font-bold">{products.length}</strong> منتج</span>
            ) : (
              <span>Total: <strong className="text-white font-bold">{products.length}</strong> products</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('nav.search_placeholder')}
                className="w-full rounded-xl border border-white/10 bg-[#141414] py-2 pl-9 pr-4 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#A1A1AA]" />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </form>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-[#141414] py-2 pl-8 pr-4 text-xs font-semibold text-white outline-none focus:border-[#D4A5A5] cursor-pointer"
              >
                <option value="featured" className="bg-[#141414] text-white">{isAr ? 'الأكثر تميزاً' : 'Featured'}</option>
                <option value="name-asc" className="bg-[#141414] text-white">{isAr ? 'الترتيب: أبجدياً (أ - ي)' : 'Name: A to Z'}</option>
                <option value="price-low" className="bg-[#141414] text-white">{isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price-high" className="bg-[#141414] text-white">{isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                <option value="rating" className="bg-[#141414] text-white">{isAr ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
              </select>
              <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#A1A1AA]" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Search Indicator Banner */}
      {search.trim() && (
        <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#D4A5A5]/15 via-[#181818] to-[#141414] border border-[#D4A5A5]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#D4A5A5]/20 flex items-center justify-center text-[#D4A5A5] shrink-0 border border-[#D4A5A5]/30">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {isAr ? 'نتائج البحث عن:' : 'Search results for:'} <span className="text-[#D4A5A5]">"{search}"</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isAr
                  ? `تم العثور على ${products.length} منتج.`
                  : `Found ${products.length} products.`}
              </p>
            </div>
          </div>

          {searchSummary?.suggestedQuery && searchSummary.suggestedQuery !== search.trim() && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <Lightbulb className="size-3.5 text-[#D4A5A5]" />
              <span className="text-zinc-300 text-[11px]">{isAr ? 'هل تقصد:' : 'Did you mean:'}</span>
              <button
                type="button"
                onClick={() => {
                  setSearch(searchSummary.suggestedQuery!);
                  setSearchInput(searchSummary.suggestedQuery!);
                  const url = new URL(window.location.href);
                  url.searchParams.set('search', searchSummary.suggestedQuery!);
                  window.history.pushState({}, '', url.toString());
                }}
                className="text-[#D4A5A5] font-bold hover:underline"
              >
                "{searchSummary.suggestedQuery}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Product Results Grid */}
      {products.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="size-16 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-center mx-auto text-[#A1A1AA]">
            <Search className="size-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {isAr ? 'لم نعثر على أي مستحضرات مطابقة' : 'No matching items found'}
          </h3>
          <p className="text-xs text-[#A1A1AA]">
            {isAr ? 'جربي البحث بكلمات مختلفة أو إزالة الفلتر الحالي' : 'Try adjusting your search criteria or resetting filters'}
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('');
              setSearch('');
              setSearchInput('');
              setMaxPrice(null);
              const url = new URL(window.location.href);
              url.search = '';
              window.history.pushState({}, '', url.toString());
            }}
            className="mt-3 inline-flex items-center rounded-xl bg-[#D4A5A5] px-5 py-2.5 text-xs font-bold text-[#0A0A0A] hover:bg-[#C89595] transition"
          >
            {isAr ? 'إعادة ضبط كل الفلاتر' : 'Reset All Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}