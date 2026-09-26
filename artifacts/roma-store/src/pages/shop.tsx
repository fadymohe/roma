import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { ProductCard } from '@/components/product-card';
import { CATEGORIES, useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';

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

  const [category, setCategory] = useState(getUrlCategory);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');

  useEffect(() => {
    const urlCat = getUrlCategory();
    if (urlCat) {
      setCategory(urlCat);
    }
  }, [wouterLocation]);

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

        if (qCat === 'face' || qCat.includes('وجه')) return pCat.includes('وجه') || pCat.includes('face');
        if (qCat === 'serum' || qCat.includes('سيروم')) return pCat.includes('سيروم') || pCat.includes('serum');
        if (qCat === 'skincare' || qCat.includes('عناية')) return pCat.includes('عناية') || pCat.includes('skin');
        if (qCat === 'moisturizers' || qCat.includes('مرطب')) return pCat.includes('مرطب') || pCat.includes('moisturizer');
        if (qCat === 'lips' || qCat.includes('شفاه')) return pCat.includes('شفاه') || pCat.includes('lip');
        if (qCat === 'accessories' || qCat.includes('إكسسوار') || qCat.includes('accessory')) return pCat.includes('إكسسوار') || pCat.includes('accessory') || pCat.includes('hair');

        return pCat.includes(qCat) || pSlug.includes(qCat);
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => {
        const ar = (p.nameAr || '').toLowerCase();
        const en = (p.nameEn || '').toLowerCase();
        const descAr = (p.descriptionAr || '').toLowerCase();
        return ar.includes(q) || en.includes(q) || descAr.includes(q);
      });
    }

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [rawProducts, category, search, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchInput('');
  };

  const categoryFilters = [
    { id: '', label: isAr ? 'جميع المستحضرات' : 'All Products' },
    { id: 'face', label: t('nav.face') },
    { id: 'serum', label: t('nav.serums') },
    { id: 'skincare', label: t('nav.skincare') },
    { id: 'moisturizers', label: t('nav.moisturizers') },
    { id: 'lips', label: t('nav.lips') },
    { id: 'accessories', label: t('nav.accessories') },
  ];

  return (
    <div className="roma-container py-8 md:py-12" dir={dir}>
      {/* Header & Subtitle */}
      <div className="mb-8">
        <span className="font-mono-brand text-xs font-bold text-[#D48B88] tracking-widest uppercase">
          ROMA COLLECTION 2026
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground mt-1">
          {t('nav.shop')}
        </h1>
        <p className="mt-2 text-xs md:text-sm text-muted-foreground max-w-xl">
          {isAr
            ? 'تصفحي جميع مستحضراتنا الطبيعية الفاخرة وإكسسواراتنا الحصرية المعززة بأنقى الخلاصات.'
            : 'Explore our complete atelier of pure botanical formulations and handcrafted women\'s accessories.'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#EFE8DE] pb-6">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {categoryFilters.map((f) => {
            const active = category === f.id;
            return (
              <button
                type="button"
                key={f.id}
                onClick={() => setCategory(f.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all shadow-2xs ${
                  active
                    ? 'bg-[#4A1525] text-white shadow-xs'
                    : 'bg-white border border-[#EFE8DE] text-foreground/75 hover:border-[#D48B88]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('nav.search_placeholder')}
              className="w-full rounded-full border border-[#EFE8DE] bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-[#D48B88] shadow-2xs"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Search className="size-3.5" />
            </button>
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none rounded-full border border-[#EFE8DE] bg-white py-2 px-4 pr-8 text-xs font-bold text-foreground outline-none focus:border-[#D48B88] shadow-2xs cursor-pointer"
            >
              <option value="featured">{isAr ? 'المميز والأحدث' : 'Featured'}</option>
              <option value="price-low">{isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
              <option value="price-high">{isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
              <option value="rating">{isAr ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Results Count & Active Filter Indicator */}
      <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isAr ? `عرض ${products.length} مستحضر` : `Showing ${products.length} products`}
        </span>
        {(category || search) && (
          <button
            type="button"
            onClick={() => {
              setCategory('');
              handleClearSearch();
            }}
            className="text-[#4A1525] font-bold underline hover:text-[#D48B88]"
          >
            {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
          </button>
        )}
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] border border-[#EFE8DE] bg-white p-12 text-center max-w-md mx-auto my-12 space-y-4">
          <div className="size-16 rounded-full bg-[#F8EBEA] text-[#4A1525] flex items-center justify-center mx-auto text-2xl">
            🌸
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">
            {isAr ? 'لم نجد منتجات تطابق بحثكِ' : 'No Products Found'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'جربي البحث بكلمة أخرى أو تصفح جميع الأقسام' : 'Try adjusting your search terms or explore all categories'}
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('');
              handleClearSearch();
            }}
            className="rounded-full bg-[#4A1525] px-6 py-2.5 text-xs font-bold text-white shadow-xs"
          >
            {isAr ? 'عرض جميع المنتجات' : 'View All Products'}
          </button>
        </div>
      )}
    </div>
  );
}