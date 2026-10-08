import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export const CATEGORIES_DATA = [
  {
    id: 'hair-accessories',
    slug: 'hair-accessories',
    nameAr: 'إكسسوارات الشعر',
    nameEn: 'Hair Accessories',
    subtitleAr: 'توك حريرية، كلبسات كلاسيكية مطلية، ودبابيس لؤلؤ فاخرة',
    subtitleEn: 'Silk scrunchies, French claw clips & fine pearl pins',
    count: 12,
    image: '/categories/cat-hair-accessories.png',
  },
  {
    id: 'look-accessories',
    slug: 'look-accessories',
    nameAr: 'إكسسوارات الإطلالة',
    nameEn: 'Look Accessories',
    subtitleAr: 'حقائب يد جلدية فاخرة، ساعات أنيقة، ونظارات عصرية مميزة',
    subtitleEn: 'Luxury leather handbags, statement watches & designer sunglasses',
    count: 15,
    image: '/categories/cat-look-accessories.png',
  },
  {
    id: 'jewelry',
    slug: 'jewelry',
    nameAr: 'مجوهرات اليد والعنق',
    nameEn: 'Hand & Neck Jewelry',
    subtitleAr: 'سلاسل وقلائد الروز جولد، خواتم سوليتير، وأقراط رقيقة',
    subtitleEn: 'Rose gold necklaces, sparkling solitaire rings & dainty earrings',
    count: 18,
    image: '/categories/cat-jewelry.png',
  },
  {
    id: 'makeup',
    slug: 'makeup',
    nameAr: 'المكياج والجمال',
    nameEn: 'Makeup & Beauty',
    subtitleAr: 'تنت الشفاه والخدود، آيلاينر كحل دقيق، ومستحضرات تجميل راقية',
    subtitleEn: 'Lip & cheek tints, precision eyeliners & couture cosmetics',
    count: 24,
    image: '/categories/cat-makeup.png',
  },
  {
    id: 'body-care',
    slug: 'body-care',
    nameAr: 'العناية بالجسم والنعومة',
    nameEn: 'Body Care & Softness',
    subtitleAr: 'ترطيب عميق للجسم، لوشن معطر، ومزيلات عرق ناعمة ومغذية',
    subtitleEn: 'Deep body hydration, scented lotions & nourishing care',
    count: 16,
    image: '/categories/cat-body-care.png',
  },
  {
    id: 'perfumes',
    slug: 'perfumes',
    nameAr: 'العطور الفاخرة',
    nameEn: 'Luxury Perfumes',
    subtitleAr: 'عطور شرقية وغربية بتركيز عالي وثبات استثنائي يدوم طويلاً',
    subtitleEn: 'Exquisite oriental & floral perfumes with lasting sillage',
    count: 20,
    image: '/categories/cat-perfumes.png',
  },
];

export default function CategoriesPage() {
  const { t, isAr, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F9FAFB] pb-24 pt-6" dir={dir}>
      <div className="roma-container max-w-4xl space-y-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            {isAr ? 'الأقسام' : 'Categories'}
          </h1>
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
