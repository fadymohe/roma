import { useState, useMemo } from 'react';
import { Search, X, ArrowLeft, ArrowRight, Sparkles, Lightbulb, Compass, Tag } from 'lucide-react';
import { useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';
import { Link, useLocation } from 'wouter';
import { smartSearchProducts, getHighlightedParts } from '@/lib/smart-search';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const liveProducts = useLiveProducts();
  const { isAr, formatPrice, dir } = useLanguage();
  const allProducts = liveProducts.length > 0 ? liveProducts : DEFAULT_PRODUCTS;

  const quickTags = [
    { label: isAr ? 'الكل' : 'All', value: 'all' },
    { label: isAr ? 'عطور فاخرة' : 'Perfumes', value: 'perfume' },
    { label: isAr ? 'إكسسوارات شعر' : 'Hair', value: 'hair' },
    { label: isAr ? 'مكياج وجمال' : 'Makeup', value: 'makeup' },
    { label: isAr ? 'عناية بالجسم' : 'Body Care', value: 'care' },
  ];

  const smartTrendingChips = [
    { label: isAr ? 'عطور فاخرة' : 'Luxury Perfumes', q: isAr ? 'عطر' : 'perfume' },
    { label: isAr ? 'سيروم لوريال' : 'Loreal Serum', q: isAr ? 'سيروم' : 'serum' },
    { label: isAr ? 'روج مات شيجلام' : 'Sheglam Lipstick', q: isAr ? 'روج' : 'lipstick' },
    { label: isAr ? 'سلاسل أنيقة' : 'Necklaces', q: isAr ? 'سلسلة' : 'necklace' },
    { label: isAr ? 'توك شعر' : 'Hair Accessories', q: isAr ? 'توكة' : 'hair' },
  ];

  const searchSummary = useMemo(() => {
    return smartSearchProducts(allProducts, query, selectedCategory);
  }, [query, selectedCategory, allProducts]);

  if (!open) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    if (query.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(query.trim())}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 p-4 pt-16 backdrop-blur-md animate-in fade-in duration-200"
      dir={dir}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-[#D4A5A5]/25 bg-[#141414] text-[#F9FAFB] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-white/10 p-4 bg-[#181818]">
          <div className="size-9 rounded-full bg-[#1F1F1F] border border-white/10 flex items-center justify-center mr-2 shadow-xs shrink-0 text-[#D4A5A5]">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? 'بحث ذكي: ابحثي عن عطر، سيروم، كريم ترطيب، روج...' : 'Smart search for perfumes, serum, skincare...'}
            className="w-full bg-transparent px-3 text-sm md:text-base outline-none text-white placeholder:text-zinc-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-white mr-1 transition"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 mr-2 transition"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </form>

        {/* Filter tags */}
        <div className="flex gap-2 overflow-x-auto p-3 border-b border-white/10 bg-[#141414] no-scrollbar">
          {quickTags.map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => setSelectedCategory(tag.value)}
              className={`rounded-full px-4 py-1.5 text-xs whitespace-nowrap transition font-medium ${
                selectedCategory === tag.value
                  ? 'bg-[#D4A5A5] text-[#0A0A0A] font-bold shadow-sm'
                  : 'bg-[#1C1C1C] text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* AI Typo / Did You Mean Suggestion */}
        {searchSummary.suggestedQuery && searchSummary.suggestedQuery !== query.trim() && (
          <div className="mx-3 mt-2.5 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#D4A5A5]/10 border border-[#D4A5A5]/25 text-xs text-[#D4A5A5]">
            <div className="flex items-center gap-2 min-w-0">
              <Lightbulb className="size-4 shrink-0 text-[#D4A5A5]" />
              <span className="truncate">
                {isAr ? 'تخمين ذكي: هل تقصد' : 'Smart guess: did you mean'}{' '}
                <strong className="text-white underline">"{searchSummary.suggestedQuery}"</strong>؟
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleApplySuggestion(searchSummary.suggestedQuery!)}
              className="px-3 py-1 rounded-lg bg-[#D4A5A5] text-[#0A0A0A] font-bold text-xs hover:brightness-110 active:scale-95 shrink-0 transition"
            >
              {isAr ? 'تطبيق' : 'Apply'}
            </button>
          </div>
        )}

        {/* Direct Category Intent Shortcut */}
        {searchSummary.intent.categorySlug && query.trim().length >= 2 && (
          <Link
            href={`/shop?category=${searchSummary.intent.categorySlug}`}
            onClick={onClose}
            className="mx-3 mt-2 flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#D4A5A5]/15 via-white/5 to-transparent border border-[#D4A5A5]/20 hover:border-[#D4A5A5]/50 transition text-xs group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-md bg-[#D4A5A5]/20 flex items-center justify-center text-[#D4A5A5] shrink-0">
                <Compass className="size-3.5" />
              </div>
              <span className="text-zinc-200 text-xs truncate">
                {isAr ? `تصفح كل قسم: ` : `Explore full category: `}
                <strong className="text-[#D4A5A5]">{searchSummary.intent.categoryAr}</strong>
              </span>
            </div>
            <span className="text-[11px] text-[#D4A5A5] font-bold flex items-center gap-1 shrink-0 group-hover:translate-x-[-2px] transition-transform">
              {isAr ? 'دخول القسم ←' : 'Explore →'}
            </span>
          </Link>
        )}

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 no-scrollbar">
          {!query.trim() && selectedCategory === 'all' ? (
            <div className="py-6 px-3">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-3">
                <Tag className="size-4 text-[#D4A5A5]" />
                <span>{isAr ? 'كلمات شائعة مقترحة بالمتجر:' : 'Popular search suggestions:'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {smartTrendingChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySuggestion(chip.q)}
                    className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-[#D4A5A5]/20 hover:text-[#D4A5A5] border border-white/10 text-zinc-300 transition"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : searchSummary.results.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <Sparkles className="size-8 mx-auto mb-2 text-[#D4A5A5]" />
              <p className="text-sm font-medium text-zinc-300">
                {isAr ? `لم نجد نتائج مطابقة لـ "${query}"` : `No results found for "${query}"`}
              </p>
              <p className="text-xs mt-1 text-zinc-500">
                {isAr ? 'جربي البحث بكلمات أخرى أو اختاري أحد الاقتراحات السريعة:' : 'Try another keyword or choose a quick suggestion:'}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {smartTrendingChips.slice(0, 3).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySuggestion(chip.q)}
                    className="px-3 py-1 rounded-full text-xs bg-[#D4A5A5]/10 text-[#D4A5A5] border border-[#D4A5A5]/20 hover:bg-[#D4A5A5] hover:text-[#0A0A0A] transition"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            searchSummary.results.map((product) => {
              const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
              const titleParts = getHighlightedParts(displayName, query);

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 rounded-2xl p-2.5 transition hover:bg-white/5 group border border-transparent hover:border-[#D4A5A5]/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-xl bg-[#1C1C1C] border border-white/5 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner group-hover:border-[#D4A5A5]/40 transition">
                      <img
                        src={product.imageUrl}
                        alt={displayName}
                        className="size-full object-contain transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#D4A5A5] transition truncate">
                        {titleParts.map((part, i) => (
                          <span
                            key={i}
                            className={part.isMatch ? 'text-[#D4A5A5] underline decoration-[#D4A5A5]/40' : ''}
                          >
                            {part.text}
                          </span>
                        ))}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-400 block truncate">{product.category}</span>
                        {product.badge && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#D4A5A5]/15 text-[#D4A5A5] border border-[#D4A5A5]/30">
                            {product.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-sm text-[#D4A5A5] font-mono-brand">
                      {formatPrice(product.price)}
                    </span>
                    {isAr ? (
                      <ArrowLeft className="size-4 text-zinc-400 group-hover:-translate-x-1 group-hover:text-[#D4A5A5] transition" />
                    ) : (
                      <ArrowRight className="size-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-[#D4A5A5] transition" />
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
