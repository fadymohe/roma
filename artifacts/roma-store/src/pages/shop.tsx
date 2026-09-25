import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useListCategories, useListProducts } from '@workspace/api-client-react';
import { ProductCard } from '@/components/product-card';
import { CATEGORIES, PRODUCTS } from '@/lib/catalog-data';

export default function Shop() {
  const [location] = useState(() => window.location.href);
  const initialCategory = new URL(location).searchParams.get('category') ?? '';
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');

  const categoriesQuery = useListCategories();
  const productsQuery = useListProducts({
    category: category || undefined,
    search: search || undefined,
  });

  const allCategories = categoriesQuery.data && categoriesQuery.data.length > 0
    ? categoriesQuery.data
    : CATEGORIES;

  const rawProducts = productsQuery.data && productsQuery.data.length > 0
    ? productsQuery.data
    : PRODUCTS;

  const products = useMemo(() => {
    let list = [...rawProducts];

    if (category) {
      list = list.filter((p) => p.category === category || p.slug.includes(category) || p.category.includes(category));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => `${p.nameAr} ${p.descriptionAr} ${p.category}`.toLowerCase().includes(q));
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

  return (
    <div className="roma-container py-8 md:py-12" dir="rtl">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-6 border-b border-[#DEE6E0] pb-8 md:flex-row md:items-end">
        <div>
          <span className="font-mono-brand text-xs font-bold tracking-widest text-[#527E5F]">
            التشكيلة الطبيعية الكاملة · All Products
          </span>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            مجموعة العناية والجمال المتكاملة
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            اختاري من بين تشكيلتنا المتميزة من السيرومات، كريمات الترطيب، مستحضرات الشفاه، وأرقى العطور بتركيبات نقية وطبيعية.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#E8EFEA] px-4 py-2 text-xs font-bold text-[#4E7A5A] font-mono-brand w-fit shadow-xs">
          <span>{products.length} مستحضر متوفر</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 space-y-4">
        {/* Category Pills (Rounded-full as in design) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            data-testid="button-filter-all"
            onClick={() => setCategory('')}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs md:text-sm font-bold transition-all shadow-xs active:scale-95 ${
              !category
                ? 'bg-[#76A080] text-white shadow-md shadow-[#76A080]/30'
                : 'border border-[#DEE6E0] bg-white text-muted-foreground hover:border-[#76A080] hover:text-foreground'
            }`}
          >
            الكل ({rawProducts.length})
          </button>
          {allCategories.map((item) => (
            <button
              type="button"
              key={item.id}
              data-testid={`button-filter-${item.id}`}
              onClick={() => setCategory(item.nameAr || item.slug)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs md:text-sm font-bold transition-all shadow-xs active:scale-95 ${
                category === item.nameAr || category === item.slug
                  ? 'bg-[#76A080] text-white shadow-md shadow-[#76A080]/30'
                  : 'border border-[#DEE6E0] bg-white text-muted-foreground hover:border-[#76A080] hover:text-foreground'
              }`}
            >
              {item.nameAr}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          {/* Search Box - Rounded Pill */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput);
            }}
            className="relative flex flex-1 max-w-md items-center rounded-full border border-[#DEE6E0] bg-white px-4 py-2.5 shadow-xs focus-within:border-[#76A080] focus-within:ring-2 focus-within:ring-[#76A080]/20"
          >
            <Search className="size-4.5 text-[#527E5F] shrink-0 ml-2.5" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="البحث في المنتجات"
              data-testid="input-product-search"
              placeholder="ابحثي بالاسم أو التصنيف الطبيعي..."
              className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchInput && (
              <button
                type="button"
                data-testid="button-clear-search"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>

          {/* Sort Dropdown - Rounded Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center rounded-full border border-[#DEE6E0] bg-white px-4 py-2 shadow-xs">
              <ArrowUpDown className="size-3.5 text-[#527E5F] ml-2" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="ترتيب المنتجات"
                data-testid="select-sort"
                className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer pr-1"
              >
                <option value="featured">المقترحة لكِ</option>
                <option value="price-low">السعر: من الأقل للأعلى</option>
                <option value="price-high">السعر: من الأعلى للأقل</option>
                <option value="rating">الأعلى تقييماً</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mt-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-[#DEE6E0] bg-white py-16 text-center shadow-xs">
            <p className="text-base font-bold text-foreground">لم نجد منتجات مطابقة لبحثكِ</p>
            <p className="text-xs text-muted-foreground mt-1">جربي البحث بكلمات أخرى أو تصفح الأقسام الكاملة</p>
            <button
              type="button"
              onClick={() => {
                setCategory('');
                setSearch('');
                setSearchInput('');
              }}
              className="mt-4 rounded-full bg-[#4E7A5A] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#3D6647]"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        )}
      </div>
    </div>
  );
}