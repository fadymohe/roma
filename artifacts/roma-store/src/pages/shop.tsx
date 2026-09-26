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
    { id: 'accessories', label: isAr ? 'إكسسوارات' : 'Accessories' },
  ];

  return (
    <div className="roma-container py-8 md:py-12 text-[#F9FAFB]" dir={dir}>
      {/* Header & Subtitle */}
      <div className="mb-8">
        <span className="font-mono-brand text-xs font-bold text-[#D4A5A5] tracking-widest uppercase">
          ROMA COLLECTION 2026
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white mt-1">
          {t('nav.shop')}
        </h1>
        <p className="mt-2 text-xs md:text-sm text-[#A1A1AA] max-w-xl">
          {isAr
            ? 'تصفحي جميع مستحضراتنا الطبيعية الفاخرة وإكسسواراتنا الحصرية المعززة بأنقى الخلاصات.'
            : 'Explore our complete atelier of pure botanical formulations and handcrafted women\'s accessories.'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/10 pb-6">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-2">
          {categoryFilters.map((f) => {
            const active = category === f.id;
            return (
              <button
                type="button"
                key={f.id}
                onClick={() => setCategory(f.id)}
                className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                  active
                    ? 'bg-[#D4A5A5] text-[#0A0A0A]'
                    : 'bg-[#141414] border border-white/10 text-[#A1A1AA] hover:text-white'
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
              <option value="price-low" className="bg-[#141414] text-white">{isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
              <option value="price-high" className="bg-[#141414] text-white">{isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
              <option value="rating" className="bg-[#141414] text-white">{isAr ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#A1A1AA]" />
          </div>
        </div>
      </div>

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
            }}
            className="mt-3 inline-flex items-center rounded-xl bg-[#D4A5A5] px-5 py-2.5 text-xs font-bold text-[#0A0A0A] hover:bg-[#C89595] transition"
          >
            {isAr ? 'إعادة ضبط كل الفلاتر' : 'Reset All Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}