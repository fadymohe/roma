import { useState, useMemo } from 'react';
import { Search, X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useLiveProducts, DEFAULT_PRODUCTS } from '@/lib/catalog-data';
import { useLanguage } from '@/lib/language-context';
import { Link, useLocation } from 'wouter';

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
    { label: isAr ? 'إكسسوارات شعر' : 'Hair', value: 'hair' },
    { label: isAr ? 'مكياج وجمال' : 'Makeup', value: 'makeup' },
    { label: isAr ? 'عطور فاخرة' : 'Perfumes', value: 'perfume' },
    { label: isAr ? 'عناية بالجسم' : 'Body Care', value: 'care' },
  ];

  const filtered = useMemo(() => {
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
    });
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-16 backdrop-blur-md animate-in fade-in duration-200"
      dir={dir}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#141414] text-[#F9FAFB] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
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
            placeholder={isAr ? 'ابحثي عن منتج، سيروم، كريم ترطيب، غسول...' : 'Search for products, serum, perfumes...'}
            className="w-full bg-transparent px-3 text-sm md:text-base outline-none text-white placeholder:text-zinc-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-white mr-1"
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
        <div className="flex gap-2 overflow-x-auto p-3 border-b border-white/10 bg-[#121212] no-scrollbar">
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

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 no-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <Sparkles className="size-8 mx-auto mb-2 text-[#D4A5A5]" />
              <p className="text-sm font-medium text-zinc-300">
                {isAr ? `لم نجد نتائج مطابقة لـ "${query}"` : `No results found for "${query}"`}
              </p>
              <p className="text-xs mt-1 text-zinc-500">
                {isAr ? 'جربي البحث بكلمات أخرى أو تصفحي التصنيفات.' : 'Try other keywords or explore categories.'}
              </p>
            </div>
          ) : (
            filtered.map((product) => {
              const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 rounded-2xl p-2.5 transition hover:bg-white/5 group border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-xl bg-[#1C1C1C] border border-white/5 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner">
                      <img
                        src={product.imageUrl}
                        alt={displayName}
                        className="size-full object-contain transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#D4A5A5] transition truncate">
                        {displayName}
                      </h4>
                      <span className="text-xs text-zinc-400 block truncate">{product.category}</span>
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
