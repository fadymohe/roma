import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Sparkles, ChevronRight, Layers } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export const CATEGORIES_DATA = [
  {
    id: 'face',
    slug: 'face',
    nameAr: 'مستحضرات الوجه والبشرة',
    nameEn: 'Face & Complexion',
    subtitleAr: 'كريمات النضارة، غسول الوجه المنقي، والبرايمر المخملي',
    subtitleEn: 'Velvet recovery creams, purifying cleansers & hydrating primers',
    count: 8,
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'serum',
    slug: 'serum',
    nameAr: 'سيرومات النضارة والإشراق',
    nameEn: 'Luminous Glow Serums',
    subtitleAr: 'نياسيناميد 10%، حمض الهيالورونيك الثلاثي، وفيتامين سي المركز',
    subtitleEn: 'Niacinamide 10%, Triple Hyaluronic Acid & Concentrated Vitamin C',
    count: 6,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'skincare',
    slug: 'skincare',
    nameAr: 'العناية بالبشرة والترطيب',
    nameEn: 'Hydration & Daily Skincare',
    subtitleAr: 'ترطيب عميق وحماية يومية لحاجز البشرة',
    subtitleEn: 'Deep moisture restoration and skin barrier defense',
    count: 12,
    image: 'https://images.unsplash.com/photo-1608248597359-59754f15d706?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'lips',
    slug: 'lips',
    nameAr: 'أحمر الشفاه والعناية بها',
    nameEn: 'Velvet Lips & Balms',
    subtitleAr: 'درجات كشميرية راقية، لمسة مطفأة مخملية تدوم طويلاً',
    subtitleEn: 'Couture cashmere shades and nourishing velvet matte textures',
    count: 9,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'accessories',
    slug: 'accessories',
    nameAr: 'إكسسوارات نسائية فاخرة',
    nameEn: 'Luxury Women Accessories',
    subtitleAr: 'سلاسل اللؤلؤ الطبيعي، أساور روز جولد، وحقائب مستحضرات جلدية',
    subtitleEn: 'Freshwater pearl chokers, 18k rose gold jewelry & vanity cases',
    count: 7,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85',
  },
];

export default function CategoriesPage() {
  const { t, isAr, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F9FAFB] pb-24 pt-6" dir={dir}>
      <div className="roma-container max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A5A5]/10 border border-[#D4A5A5]/20 text-[#D4A5A5] text-xs font-semibold">
            <Layers className="size-3.5" />
            <span>{isAr ? 'أقسام المتجر' : 'Store Catalog'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white">
            {isAr ? 'تصفحي جميع مجموعات روما' : 'Explore All ROMA Collections'}
          </h1>
          <p className="text-xs md:text-sm text-[#A1A1AA]">
            {isAr
              ? 'مستحضرات تجميل راقية وعناية متكاملة مصممة بأعلى معايير الفخامة والجمال.'
              : 'Atelier formulations and luxury accessories crafted with pristine elegance.'}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {CATEGORIES_DATA.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-[#141414] p-6 min-h-[220px] shadow-lg transition hover:border-[#D4A5A5]/40 hover:scale-[1.01]"
            >
              {/* Background Image with Dark Gradient Overlay */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.nameAr}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#D4A5A5] uppercase tracking-wider">
                    {cat.count} {isAr ? 'منتج حصري' : 'products'}
                  </span>
                  <div className="size-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#D4A5A5] group-hover:text-[#0A0A0A] transition">
                    {isAr ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                  </div>
                </div>

                <h3 className="text-lg md:text-xl font-bold font-display text-white group-hover:text-[#D4A5A5] transition">
                  {isAr ? cat.nameAr : cat.nameEn}
                </h3>
                <p className="text-xs text-[#A1A1AA] line-clamp-1">
                  {isAr ? cat.subtitleAr : cat.subtitleEn}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
