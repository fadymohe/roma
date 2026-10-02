import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ArrowLeft, ArrowRight, Sparkles, Tag, Compass, Lightbulb } from 'lucide-react';
import { useLiveProducts, DEFAULT_PRODUCTS, Product } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';
import { Link, useLocation } from 'wouter';
import { smartSearchProducts, getHighlightedParts } from '@/lib/smart-search';

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Popular smart recommendations when input is focused or empty
  const smartTrendingChips = [
    { label: isAr ? 'عطور فاخرة' : 'Luxury Perfumes', q: isAr ? 'عطر' : 'perfume' },
    { label: isAr ? 'سيروم لوريال' : 'Loreal Serum', q: isAr ? 'سيروم' : 'serum' },
    { label: isAr ? 'روج مات' : 'Matte Lipstick', q: isAr ? 'روج' : 'lipstick' },
    { label: isAr ? 'سلاسل أنيقة' : 'Necklaces', q: isAr ? 'سلسلة' : 'necklace' },
    { label: isAr ? 'توك وشعر' : 'Hair Accessories', q: isAr ? 'توكة' : 'hair' },
  ];

  // Execute AI smart search
  const searchSummary = useMemo(() => {
    return smartSearchProducts(allProducts, query, 'all');
  }, [query, allProducts]);

  const displayResults = useMemo(() => {
    return searchSummary.results.slice(0, 6);
  }, [searchSummary.results]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(query.trim())}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Integrated Search Input Form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full rounded-full bg-[#141414] border border-white/10 hover:border-[#D4A5A5]/40 focus-within:border-[#D4A5A5] focus-within:ring-2 focus-within:ring-[#D4A5A5]/20 transition-all duration-200 shadow-inner group"
      >
        <div className="ps-3.5 pe-1.5 flex items-center pointer-events-none text-[#D4A5A5] transition-transform group-focus-within:scale-110">
          <Search className="size-4" strokeWidth={2} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={isAr ? 'ابحثي عن عطر، سيروم، روج، إكسسوار...' : 'Search for perfume, serum, jewelry...'}
          className="w-full bg-transparent py-2 px-1 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 me-1 text-zinc-400 hover:text-white rounded-full transition hover:bg-white/10"
            aria-label="Clear"
          >
            <X className="size-3.5" />
          </button>
        )}

        <button
          type="submit"
          className="me-1 px-3 py-1.5 rounded-full bg-[#D4A5A5]/15 hover:bg-[#D4A5A5] text-[#D4A5A5] hover:text-[#0A0A0A] text-xs font-bold transition active:scale-95 shrink-0 flex items-center gap-1 shadow-sm"
        >
          <span>{isAr ? 'بحث' : 'Go'}</span>
        </button>
      </form>

      {/* Real-time Inline Results Dropdown */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-white/15 bg-[#141414]/98 backdrop-blur-2xl shadow-2xl p-3 text-white overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 ${
            variant === 'mobile' ? 'w-full' : 'min-w-[360px] md:min-w-[450px]'
          }`}
        >

          {/* AI "Did You Mean / هل تقصد" Suggestion Pill */}
          {searchSummary.suggestedQuery && searchSummary.suggestedQuery !== query.trim() && (
            <div className="flex items-center justify-between gap-2 p-2 mb-2 rounded-xl bg-[#D4A5A5]/10 border border-[#D4A5A5]/25 text-xs text-[#D4A5A5] animate-in fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <Lightbulb className="size-3.5 shrink-0 text-[#D4A5A5]" />
                <span className="truncate">
                  {isAr ? 'تخمين ذكي: هل تقصد' : 'Smart guess: did you mean'}{' '}
                  <strong className="text-white underline">"{searchSummary.suggestedQuery}"</strong>؟
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleApplySuggestion(searchSummary.suggestedQuery!)}
                className="px-2.5 py-0.5 rounded-lg bg-[#D4A5A5] text-[#0A0A0A] font-bold text-[11px] hover:brightness-110 active:scale-95 shrink-0 transition"
              >
                {isAr ? 'نعم، طبّق' : 'Apply'}
              </button>
            </div>
          )}

          {/* Direct Category Intent Shortcut (e.g. When searching for "عطر", suggest visiting Luxury Perfumes) */}
          {searchSummary.intent.categorySlug && query.trim().length >= 2 && (
            <Link
              href={`/shop?category=${searchSummary.intent.categorySlug}`}
              onClick={() => {
                setIsOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center justify-between p-2 mb-2 rounded-xl bg-gradient-to-r from-[#D4A5A5]/15 via-white/5 to-transparent border border-[#D4A5A5]/20 hover:border-[#D4A5A5]/50 transition text-xs group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-6 rounded-md bg-[#D4A5A5]/20 flex items-center justify-center text-[#D4A5A5] shrink-0">
                  <Compass className="size-3.5" />
                </div>
                <span className="text-zinc-200 text-[11px] truncate">
                  {isAr ? `تصفح قسم: ` : `Explore category: `}
                  <strong className="text-[#D4A5A5]">{searchSummary.intent.categoryAr}</strong>
                </span>
              </div>
              <span className="text-[10px] text-[#D4A5A5] font-bold flex items-center gap-1 shrink-0 group-hover:translate-x-[-2px] transition-transform">
                {isAr ? 'دخول القسم ←' : 'View →'}
              </span>
            </Link>
          )}

          {/* Results List */}
          <div className="max-h-[340px] overflow-y-auto space-y-1.5 no-scrollbar">
            {!query.trim() ? (
              // Empty search state - Smart Trending suggestions
              <div className="py-4 px-2">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-2.5">
                  <Tag className="size-3.5 text-[#D4A5A5]" />
                  <span>{isAr ? 'الأكثر بحثاً الآن بالمحل:' : 'Popular searches right now:'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {smartTrendingChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySuggestion(chip.q)}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-[#D4A5A5]/20 hover:text-[#D4A5A5] border border-white/10 text-zinc-300 transition"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : displayResults.length === 0 ? (
              // No results found state
              <div className="py-7 text-center text-zinc-400">
                <Sparkles className="size-7 mx-auto mb-2 text-[#D4A5A5]/60" />
                <p className="text-xs font-semibold text-zinc-300">
                  {isAr ? `لم نجد نتائج مطابقة لـ "${query}"` : `No matches found for "${query}"`}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-[260px] mx-auto">
                  {isAr ? 'جربي البحث بكلمة أخرى أو اختاري أحد الاقتراحات السريعة أدناه:' : 'Try another keyword or choose a suggestion below:'}
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {smartTrendingChips.slice(0, 3).map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySuggestion(chip.q)}
                      className="px-2.5 py-1 rounded-full text-[10px] bg-[#D4A5A5]/10 text-[#D4A5A5] border border-[#D4A5A5]/20 hover:bg-[#D4A5A5] hover:text-[#0A0A0A] transition"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              displayResults.map((product) => {
                const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
                const titleParts = getHighlightedParts(displayName, query);

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-white/5 group border border-transparent hover:border-[#D4A5A5]/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-11 rounded-lg bg-[#1C1C1C] border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner group-hover:border-[#D4A5A5]/40 transition">
                        <img
                          src={product.imageUrl}
                          alt={displayName}
                          className="size-full object-contain transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#D4A5A5] transition">
                          {titleParts.map((part, i) => (
                            <span
                              key={i}
                              className={part.isMatch ? 'text-[#D4A5A5] underline decoration-[#D4A5A5]/40' : ''}
                            >
                              {part.text}
                            </span>
                          ))}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {product.category || (isAr ? 'عناية وجمال' : 'Cosmetics')}
                          </span>
                          {product.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#D4A5A5]/15 text-[#D4A5A5] border border-[#D4A5A5]/30">
                              {product.badge}
                            </span>
                          )}
                        </div>
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

          {/* Bottom Footer / View All Link */}
          {displayResults.length > 0 && (
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
                {isAr ? 'عرض كافة النتائج بالمتجر ←' : 'View all results in shop →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
