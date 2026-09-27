import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';
import { Link, useLocation } from 'wouter';

export interface IntegratedSearchProps {
  className?: string;
  variant?: 'desktop' | 'mobile';
  autoFocus?: boolean;
}

export function IntegratedSearch({ className = '', variant = 'desktop', autoFocus = false }: IntegratedSearchProps) {
  const [, setLocation] = useLocation();
  const { isAr, formatPrice } = useLanguage();
  const liveProducts = useLiveProducts();
  const allProducts = liveProducts.length > 0 ? liveProducts : DEFAULT_PRODUCTS;

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickTags = [
    { label: isAr ? 'الكل' : 'All', value: 'all' },
    { label: isAr ? 'إكسسوارات شعر' : 'Hair', value: 'hair' },
    { label: isAr ? 'مكياج' : 'Makeup', value: 'makeup' },
    { label: isAr ? 'عطور' : 'Perfumes', value: 'perfume' },
    { label: isAr ? 'عناية' : 'Skincare', value: 'care' },
  ];

  const filtered = useMemo(() => {
    if (!query.trim() && selectedCategory === 'all') return [];

    return allProducts.filter((product) => {
      const q = query.toLowerCase().trim();
      const name = (product.nameAr + ' ' + (product.nameEn || '') + ' ' + (product.descriptionAr || '')).toLowerCase();
      const matchesText = !q || name.includes(q);

      const cat = (product.category || '').toLowerCase();
      let matchesCat = true;
      if (selectedCategory === 'hair') matchesCat = cat.includes('شعر') || cat.includes('hair');
      else if (selectedCategory === 'makeup') matchesCat = cat.includes('مكياج') || cat.includes('makeup') || cat.includes('روج');
      else if (selectedCategory === 'perfume') matchesCat = cat.includes('عطر') || cat.includes('perfume');
      else if (selectedCategory === 'care') matchesCat = cat.includes('عناية') || cat.includes('جسم') || cat.includes('skin');

      return matchesText && matchesCat;
    }).slice(0, 6);
  }, [query, selectedCategory, allProducts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(query.trim())}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Integrated Search Input Form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full rounded-full bg-[#141414] border border-white/10 hover:border-[#D4A5A5]/40 focus-within:border-[#D4A5A5] focus-within:ring-2 focus-within:ring-[#D4A5A5]/20 transition-all duration-200 shadow-inner"
      >
        <div className="ps-3.5 pe-1.5 flex items-center pointer-events-none text-[#D4A5A5]">
          <Search className="size-4" strokeWidth={1.75} />
        </div>

        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={isAr ? 'ابحثي عن سيروم، عطر، مكياج، إكسسوار...' : 'Search for perfume, serum, jewelry...'}
          className="w-full bg-transparent py-2 px-1 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="p-1 me-1 text-zinc-400 hover:text-white rounded-full transition"
            aria-label="Clear"
          >
            <X className="size-3.5" />
          </button>
        )}

        <button
          type="submit"
          className="me-1 px-3 py-1.5 rounded-full bg-[#D4A5A5]/15 hover:bg-[#D4A5A5] text-[#D4A5A5] hover:text-[#0A0A0A] text-xs font-bold transition active:scale-95 shrink-0"
        >
          {isAr ? 'بحث' : 'Go'}
        </button>
      </form>

      {/* Real-time Inline Results Dropdown */}
      {isOpen && (query.trim().length > 0 || selectedCategory !== 'all') && (
        <div
          className={`absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-white/15 bg-[#141414]/98 backdrop-blur-2xl shadow-2xl p-3 text-white overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 ${
            variant === 'mobile' ? 'w-full' : 'min-w-[340px] md:min-w-[420px]'
          }`}
        >
          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b border-white/10 overflow-x-auto no-scrollbar">
            {quickTags.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => setSelectedCategory(tag.value)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition shrink-0 ${
                  selectedCategory === tag.value
                    ? 'bg-[#D4A5A5] text-[#0A0A0A]'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-[340px] overflow-y-auto space-y-1.5 no-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-zinc-400">
                <Sparkles className="size-6 mx-auto mb-2 text-[#D4A5A5]/60" />
                <p className="text-xs font-medium text-zinc-300">
                  {isAr ? `لم نجد نتائج مطابقة لـ "${query}"` : `No results found for "${query}"`}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {isAr ? 'جربي البحث باسم آخر أو اضغطي زر البحث لعرض كل المنتجات.' : 'Try another keyword or view all in shop.'}
                </p>
              </div>
            ) : (
              filtered.map((product) => {
                const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-white/5 group border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-11 rounded-lg bg-[#1C1C1C] border border-white/5 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner">
                        <img
                          src={product.imageUrl}
                          alt={displayName}
                          className="size-full object-contain transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#D4A5A5] transition">
                          {displayName}
                        </h4>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          {product.category || (isAr ? 'عناية وجمال' : 'Cosmetics')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-[#D4A5A5] font-mono-brand">
                        {formatPrice(product.price)}
                      </span>
                      {isAr ? (
                        <ArrowLeft className="size-3 text-zinc-400 group-hover:-translate-x-1 group-hover:text-[#D4A5A5] transition" />
                      ) : (
                        <ArrowRight className="size-3 text-zinc-400 group-hover:translate-x-1 group-hover:text-[#D4A5A5] transition" />
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {filtered.length > 0 && (
            <div className="pt-2 mt-2 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setLocation(`/shop?search=${encodeURIComponent(query.trim())}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] font-bold text-[#D4A5A5] hover:underline"
              >
                {isAr ? 'عرض كافة النتائج في المتجر ←' : 'View all results in shop →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
