import { useState, useMemo } from 'react';
import { Search, X, ArrowLeft, Sparkles } from 'lucide-react';
import { PRODUCTS } from '@/lib/catalog-data';
import { Link } from 'wouter';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesText =
        !query.trim() ||
        `${product.nameAr} ${product.descriptionAr} ${product.slug}`
          .toLowerCase()
          .includes(query.toLowerCase().trim());

      const matchesCat =
        selectedCategory === 'all' || product.category === selectedCategory;

      return matchesText && matchesCat;
    });
  }, [query, selectedCategory]);

  if (!open) return null;

  const quickTags = [
    { label: 'الكل', value: 'all' },
    { label: 'أحمر شفاه', value: 'أحمر الشفاه والقلوس' },
    { label: 'عناية بالبشرة', value: 'العناية الفائقة بالبشرة' },
    { label: 'فاونديشن', value: 'كريم الأساس والوجه' },
    { label: 'عطور', value: 'العطور الفاخرة وبخاخات الجسم' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/50 p-4 pt-16 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-[28px] border border-border bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-border p-4 bg-[#FAFBF9]">
          <div className="size-9 rounded-full bg-white border border-border flex items-center justify-center mr-2 shadow-xs shrink-0">
            <Search className="size-4 text-[#4E7A5A]" />
          </div>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحثي عن منتج، سيروم، كريم ترطيب، غسول..."
            className="w-full bg-transparent px-3 text-sm md:text-base outline-none text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground mr-1"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted mr-2 transition"
          >
            إلغاء
          </button>
        </div>

        {/* Filter tags */}
        <div className="flex gap-2 overflow-x-auto p-3 border-b border-border/50 bg-[#E8EFEA]/40 scrollbar-none">
          {quickTags.map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => setSelectedCategory(tag.value)}
              className={`rounded-full px-4 py-1.5 text-xs whitespace-nowrap transition font-medium ${
                selectedCategory === tag.value
                  ? 'bg-[#4E7A5A] text-white font-bold shadow-sm'
                  : 'bg-white text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Sparkles className="size-8 mx-auto mb-2 text-[#76A080]" />
              <p className="text-sm font-medium">لم نجد نتائج مطابقة لـ "{query}"</p>
              <p className="text-xs mt-1">جربي البحث بكلمات أخرى أو تصفحي التصنيفات.</p>
            </div>
          ) : (
            filtered.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                onClick={onClose}
                className="flex items-center justify-between gap-3 rounded-2xl p-2.5 transition hover:bg-[#E8EFEA]/50 group border border-transparent hover:border-[#76A080]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-[#E8EFEA] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.nameAr}
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-[#4E7A5A] transition">
                      {product.nameAr}
                    </h4>
                    <span className="text-xs text-muted-foreground">{product.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#4E7A5A] font-mono-brand">
                    {product.price} ج.م
                  </span>
                  <ArrowLeft className="size-4 text-muted-foreground group-hover:-translate-x-1 group-hover:text-[#4E7A5A] transition" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
