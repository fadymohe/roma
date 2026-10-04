import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Truck,
  Heart,
  Check,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Zap,
  Award,
  Leaf,
  Droplets,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { DEFAULT_PRODUCTS, useLiveProducts, getProductDiscount, type Product } from '@/lib/catalog-data';
import { ProductCard } from '@/components/product-card';

function getProductReviews(product: Product, isAr: boolean) {
  const numId = typeof product.id === 'number'
    ? product.id
    : Array.from(String(product.id || '1')).reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const isPerfume = Boolean(product.category?.includes('عطر') || product.categoryEn?.toLowerCase().includes('perfume'));
  const isHair = Boolean(product.category?.includes('شعر') || product.categoryEn?.toLowerCase().includes('hair'));
  const isJewelry = Boolean(product.category?.includes('مجوهرات') || product.categoryEn?.toLowerCase().includes('jewelry'));
  const isBeauty = Boolean(product.category?.includes('مكياج') || product.category?.includes('جسم') || product.category?.includes('عناية') || product.categoryEn?.toLowerCase().includes('beauty'));

  const names = [
    { ar: 'نوران الشناوي', en: 'Nouran El-Shenawy', loc: 'التجمع الخامس' },
    { ar: 'سارة المهدي', en: 'Sarah El-Mahdy', loc: 'مصر الجديدة' },
    { ar: 'مريم القاضي', en: 'Mariam El-Qady', loc: 'المعادي' },
    { ar: 'حبيبة الجوهري', en: 'Habiba El-Gohary', loc: 'الشيخ زايد' },
    { ar: 'ياسمين خليل', en: 'Yasmine Khalil', loc: 'الإسكندرية' },
    { ar: 'ندى الشريف', en: 'Nada El-Sherif', loc: 'الدقي' },
    { ar: 'آية منصور', en: 'Aya Mansour', loc: 'المنصورة' },
    { ar: 'سلمى رضوان', en: 'Salma Radwan', loc: 'مدينة نصر' },
    { ar: 'دينا عثمان', en: 'Dina Othman', loc: 'المهندسين' },
    { ar: 'فريدة زايد', en: 'Farida Zayed', loc: 'طنطا' },
    { ar: 'ملك الباز', en: 'Malak El-Baz', loc: 'الزمالك' },
    { ar: 'هاجر السعيد', en: 'Hagar El-Saeed', loc: 'الشروق' },
    { ar: 'شروق عبد الرحمن', en: 'Shorouk Abdelrahman', loc: 'الرحاب' },
    { ar: 'خديجة سامي', en: 'Khadija Samy', loc: 'الهرم' },
    { ar: 'ميرنا عاطف', en: 'Mirna Atef', loc: 'سموحة' },
    { ar: 'رضوى زهران', en: 'Radwa Zahran', loc: 'مدينتي' },
    { ar: 'تسنيم بدر', en: 'Tasneem Badr', loc: 'العاشر من رمضان' },
    { ar: 'منة الله شاكر', en: 'Menna Shaker', loc: 'العبور' },
    { ar: 'لبنى عاصم', en: 'Lobna Assem', loc: 'بني سويف' },
    { ar: 'يارا النجار', en: 'Yara El-Naggar', loc: 'الزقازيق' },
    { ar: 'ماهينور الجمال', en: 'Mahinour El-Gammal', loc: 'جاردن سيتي' },
    { ar: 'هبة القوصي', en: 'Heba El-Qoussi', loc: 'شبرا' },
    { ar: 'سهيلة فهمي', en: 'Suhaila Fahmy', loc: 'بورسعيد' },
    { ar: 'بسنت توفيق', en: 'Passant Tawfik', loc: 'السويس' },
    { ar: 'نهى مصطفى', en: 'Noha Moustafa', loc: 'أسيوط' },
    { ar: 'كارمن النحاس', en: 'Karmine El-Nahas', loc: 'المقطم' },
    { ar: 'جيهان فايز', en: 'Gihan Fayez', loc: 'الإسماعيلية' },
    { ar: 'رنا البرنس', en: 'Rana El-Prince', loc: 'دمنهور' },
    { ar: 'إيمان غنيم', en: 'Eman Ghoneim', loc: 'المحلة الكبرى' },
    { ar: 'ليلى الأزهري', en: 'Layla El-Azhary', loc: 'الفيوم' },
    { ar: 'نورهان خطاب', en: 'Nourhan Khattab', loc: 'العجوزة' },
    { ar: 'ميسرة عبد العزيز', en: 'Maysara Abdelaziz', loc: 'المنيل' },
    { ar: 'شيماء بدر الدين', en: 'Shaimaa Badr', loc: 'شرم الشيخ' },
    { ar: 'أروى حسني', en: 'Arwa Hosny', loc: 'الغردقة' },
    { ar: 'دنيا وجدي', en: 'Donia Wagdy', loc: 'بنها' },
    { ar: 'نادين صبري', en: 'Nadine Sabry', loc: 'كفر الشيخ' },
  ];

  const perfumeReviews = [
    {
      ar: 'ريحته فواحة وثابتة جداً؛ رشيته الصبح وفضل في هدومي لتاني يوم بنفس القوة. كل ما أقابل حد يسألني عن اسمه، التغليف شيك جداً ووصلني مغلف بعناية.',
      en: 'Incredible scent and lasting sillage! Stayed on my clothes over 24 hours. Everyone asks what perfume I am wearing.'
    },
    {
      ar: 'عطر أنثوي فخم ومميز مش مكرر، الميكس بين النوتات هادي وراقي ومبيوجعش الصداع خالص. الزجاجة شكلها قطعة ديكور على التسريحة.',
      en: 'Very sophisticated, feminine and non-cloying. The bottle looks luxurious on my vanity table.'
    },
    {
      ar: 'طلبته وأنا مترددة شوية بس بجد طلع فوق الخيال؛ الفوحان ممتاز ومناسب جداً للمناسبات والسهرات. المندوب كان محترم جداً وخلاني أعاين العلبة قبل الاستلام.',
      en: 'Exceeded my expectations! Sillage is wonderful for evening events. Courier was very respectful and allowed inspection.'
    },
    {
      ar: 'ثبات العطر على الجلد 8 ساعات وعلى الملابس بيقعد يومين كاملين. نوتاته بتبدأ منعشة وتهدى على لمسة بودرية دافية وناعمة، تجربة شراء ممتازة.',
      en: 'Stays 8 hours on skin and 2 days on clothes. Starts fresh and settles into a warm powdery dry-down.'
    },
    {
      ar: 'الباكدجينج تحفة وينفع هدية قيمة جداً، سرعة التوصيل أبهرتني وصلني في أقل من 24 ساعة في المعادي، شكراً ليكم بجد.',
      en: 'Stunning packaging, makes a luxurious gift. Next-day delivery blew me away, truly grateful.'
    },
    {
      ar: 'عطر رايق وجذاب وثباته تحفة، عجب كل صاحباتي في الشغل والكل افتكره براند عالمي مستورد بآلاف. سعره يستاهل كل قرش.',
      en: 'Elegant and magnetic scent. All my colleagues thought it was an expensive international designer perfume.'
    },
    {
      ar: 'ريحته هادية وفخمة في نفس الوقت، مش نفاذة تضايق، بالعكس مريحة للأعصاب. دي تالت مرة أطلب من المتجر وكل مرة بيبهروني.',
      en: 'Calming and luxurious at once. Not overpowering, very soothing. My 3rd time ordering from Roma Store!'
    },
    {
      ar: 'أحلى حاجة إن العطر أصلي وتركيزه عالي ومبيغيرش ريحته مع الوقت. تجربة ممتازة وخدمة العملاء على الواتساب قمة في الذوق.',
      en: 'Concentrated authentic perfume that doesn’t turn sour over time. Excellent customer support on WhatsApp.'
    },
  ];

  const hairReviews = [
    {
      ar: 'المعدن متين جداً واللمعة بتاعته فخمة ومبتتغيرش، مسكته قوية جداً للشعر التقيل ومبيزحلقش خالص طول اليوم حتى مع الحركة.',
      en: 'Heavy-duty metal with gorgeous non-tarnishing shine. Secure hold for thick hair with zero slippage.'
    },
    {
      ar: 'القطع في الطبيعة أحلى بكتير من الصور، الكواليتي عالية والسوستة مرنة ومش بتكسر الشعر أو تشده. بنتي فرحت بيه جداً.',
      en: 'Even prettier in person than pictures! Smooth gentle spring that does not tug or pull fine hair.'
    },
    {
      ar: 'الديزاين راقي وشيك جداً، بيدي لوك أنيق لأي تسريحة شعر بسيطة. التغليف جه نظيف ومعاه كيس حماية، وسعره ممتاز مقارنة بالمحلات.',
      en: 'Ultra-chic design, instantly elevates any everyday hairstyle. Came protected and packed cleanly.'
    },
    {
      ar: 'خامة ممتازة ومابتسببش أي صداع من الشد، وبتحكم الشعر الهايش والكيرلي كويس جداً. طلبت منه لونين وهطلب باقي الألوان بإذن الله.',
      en: 'Comfortable fit with no tension headaches. Holds curly volume perfectly, ordered another set!'
    },
    {
      ar: 'التفاصيل معمولة بإتقان ومفيش أي أطراف حادة تعور الفروة. الشحن وصلني تاني يوم على طول والمندوب كان قمة في الاحترام.',
      en: 'Polished edges that do not scratch the scalp. Super fast delivery and great courier.'
    },
    {
      ar: 'شياكة غير عادية! مناسب جداً للمشاوير والجامعة والمناسبات، كل اللي بيشوفه في شعري بيسألني جايباه منين.',
      en: 'Remarkable elegance! Perfect for university, work, and gatherings. Constant compliments.'
    },
    {
      ar: 'الألوان مطابقة للصور بالظبط، والخامات متماسكة ومبتتقشرش حتى بعد استخدام يومي مكثف. اختيار موفق جداً.',
      en: 'Colors match photos exactly. High durability without any peeling after weeks of daily wear.'
    },
    {
      ar: 'مسكته محكمة ومريحة جداً ومبيوقعش من الشعر الناعم. تجربة أولى ممتازة وهكرر الشراء أكيد.',
      en: 'Secure hold even for silky soft hair. Wonderful first purchase and definitely shopping again.'
    },
  ];

  const jewelryReviews = [
    {
      ar: 'الفينش احترافي جداً ولمعان الفصوص يخطف العين، كأنها دهب حقيقي عيار 18 بالظبط! مغيرتش لون مع الاستخدام ولا عملت أي حساسية.',
      en: 'Master craftsmanship, stones sparkle like real 18k gold jewelry! No color fading or allergies.'
    },
    {
      ar: 'القطعة رقيقة جداً وأنيقة في اللبس ومقاسها مظبوط بالمللي. التغليف فاخر جداً ومناسب يتقدم هدية راقية بدون أي مجهود.',
      en: 'Dainty and fits like a dream. Luxury box and pouch, ready to be gifted immediately.'
    },
    {
      ar: 'أول مرة أطلب مجوهرات أونلاين وتطلع أحسن من المتوقع، اللمعة ثابتة والقفل محكم ومبيفكش بسهولة. شكراً روما على المصداقية.',
      en: 'Best online jewelry purchase ever. Firm clasp and luminous shine. Kudos to Roma for genuine quality.'
    },
    {
      ar: 'تفاصيل الشغل دقيقة وناعمة ومبتشبكش في الهدوم خالص. وصلني مع كارت الضمان وعلبة شيك جداً، هكون عميلة دائمة عندكم.',
      en: 'Fine seamless finish that does not snag on delicate fabrics. Permanent customer here!'
    },
    {
      ar: 'خامة ممتازة ومظهر ملكي فخم يجنن، لبستها في مناسبة عائلية وكل الناس افتكروها ألماس. التوصيل كان سريع ومعاينة قبل الدفع ممتازة.',
      en: 'Regal brilliance! Wore it to a wedding and everyone thought it was genuine diamond jewelry.'
    },
    {
      ar: 'رقيقة وشيك جداً في اللبس اليومي، بستحمى بيها ومفيش أي تغير في اللون أو بهتان. جودة تحترم بجد.',
      en: 'Resistant to water and perfume, retains bright gleam effortlessly. Outstanding value.'
    },
  ];

  const beautyReviews = [
    {
      ar: 'التركيبة خفيفة جداً وسريعة الامتصاص ومش بتسيب أي ملمس دهني أو تزييت. حسيت بفرق واضح في ترطيب ونضارة بشرتي من أول استخدامين.',
      en: 'Lightweight and absorbs instantly without greasiness. Noticeable difference in hydration from day two.'
    },
    {
      ar: 'مكوناته لطيفة وآمنة ومسببش أي تحسس أو حبوب لبشرتي الحساسة. ريحته هادية ونظيفة وبتدوم وقت طويل.',
      en: 'Extremely gentle on sensitive skin, caused zero flare-ups or breakouts. Very pleasant, clean scent.'
    },
    {
      ar: 'النتيجة ظهرت معايا بسرعة وبشرتي بقت أنعم ومشرقة أكتر. التغليف محكم والمنتج وصل أصلي ومقفل ومطابق تماماً للمواصفات.',
      en: 'Swift visible results, skin feels smoother and luminous. Came sealed and 100% authentic.'
    },
    {
      ar: 'من أحسن المنتجات اللي جربتها السنة دي، التغطية والترطيب ممتازين وبيدوا لوك ناتشورال ومريح جداً طول اليوم.',
      en: 'One of my top beauty finds this year. Leaves a natural healthy finish that lasts comfortably.'
    },
    {
      ar: 'الباكدج أنيق ومضخة الاستخدام مريحة جداً بتنزل الكمية المظبوطة بدون هدر. شكراً على سرعة التوصيل والأمانة.',
      en: 'Convenient pump dispenser and elegant bottle. High integrity brand and fast delivery.'
    },
    {
      ar: 'فرق كبير جداً في ملمس بشرتي، حتى الميكب بقى شكله أحسن وأنظف بكتير بعد ما استخدمته. يستاهل التجربة بالتأكيد.',
      en: 'Transformed my skin texture, makeup sits smoothly and flawlessly now. Absolutely worth it.'
    },
  ];

  const generalReviews = [
    {
      ar: 'الخامة فاخرة والتفاصيل مبهرة بكل ما تعنيه الكلمة. منتج عملي ومطابق للوصف بالمللي والتغليف محترم جداً.',
      en: 'Exceptional material quality and craftsmanship. Matches catalog specs to the letter.'
    },
    {
      ar: 'جودة التصنيع عالية جداً وأفضل بكتير من المنتجات المتوفرة في السوق بنفس السعر. تجربة شراء موفقة ومميزة.',
      en: 'Superior manufacturing quality compared to market alternatives in this price bracket.'
    },
    {
      ar: 'التعامل ممتاز وسرعة في التوصيل لغاية باب البيت، وسهولة المعاينة قبل الدفع تدي ثقة كبيرة في البراند.',
      en: 'Prompt door-to-door delivery and welcoming courier. Inspires great trust in Roma.'
    },
    {
      ar: 'المنتج متقن ومريح جداً، الألوان والخامات ممتازة والتغليف يحافظ عليه من أي خدش أثناء الشحن.',
      en: 'Impeccable condition upon arrival, thoughtfully wrapped to avoid any transit damage.'
    },
  ];

  const pool = isPerfume ? perfumeReviews : isHair ? hairReviews : isJewelry ? jewelryReviews : isBeauty ? beautyReviews : generalReviews;

  // 4 to 6 reviews per product to give rich depth
  const reviewCount = 4 + (numId % 3);
  const reviewsList: { name: string; city: string; rating: number; comment: string; date: string }[] = [];

  for (let i = 0; i < reviewCount; i++) {
    const nameIndex = (numId * 13 + i * 7) % names.length;
    const nameObj = names[nameIndex];
    const revIndex = (numId * 11 + i * 5) % pool.length;
    const revObj = pool[revIndex];

    // Mostly 5 stars, occasionally a 4 star
    const rating = (numId + i) % 7 === 0 ? 4 : 5;
    const daysAgo = (i + 1) * 2 + (numId % 3);
    const dateStr = isAr ? `منذ ${daysAgo} أيام` : `${daysAgo} days ago`;

    reviewsList.push({
      name: isAr ? nameObj.ar : nameObj.en,
      city: nameObj.loc,
      rating,
      comment: isAr ? revObj.ar : revObj.en,
      date: dateStr,
    });
  }

  return reviewsList;
}

export default function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const liveProducts = useLiveProducts();
  const { add, count: cartCount } = useCart();
  const { isWishlisted, toggleWishlist } = useAuth();
  const { t, isAr, formatPrice, dir } = useLanguage();

  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'howTo' | 'reviews'>('desc');
  const touchStartX = useRef<number | null>(null);

  // Always scroll to top when opening or switching products
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  // Match product from live dynamic list or default products
  const product: Product =
    liveProducts.find((p) => p.slug === slug) ||
    DEFAULT_PRODUCTS.find((p) => p.slug === slug) ||
    liveProducts[0] ||
    DEFAULT_PRODUCTS[0];

  const variant = product.variants?.[selectedVariant] || product.variants?.[0];
  const favorited = isWishlisted(product.id);

  const reviews = useMemo(() => getProductReviews(product, isAr), [product, isAr]);

  const productRatingAvg = useMemo(() => {
    if (!reviews || reviews.length === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const displayName = isAr ? product.nameAr : (product.nameEn || product.nameAr);
  const displayDescription = isAr ? product.descriptionAr : (product.descriptionEn || product.descriptionAr);
  const displayIngredients = isAr ? product.ingredientsAr : (product.ingredientsEn || product.ingredientsAr);
  const displayHowToUse = isAr ? product.howToUseAr : (product.howToUseEn || product.howToUseAr);
  const displayBadge = isAr ? product.badge : (product.badgeEn || product.badge);
  const { discountPercent, compareAtPrice: effectiveCompareAtPrice } = getProductDiscount(product);

  const galleryImages = [
    product.imageUrl,
    ...(product.additionalImages || []),
  ].filter(Boolean);

  const addToBag = () => {
    for (let index = 0; index < quantity; index += 1) {
      add(product, variant);
    }
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  const buyNowDirect = () => {
    add(product, variant);
    setLocation('/cart');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: displayName,
        text: displayDescription,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(isAr ? 'تم نسخ رابط المنتج للمشاركة!' : 'Product link copied to clipboard!');
    }
  };

  // Touch swipe support for Amazon-style carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next image
        setSelectedImage((prev) => (prev + 1) % galleryImages.length);
      } else {
        // swipe right -> prev image
        setSelectedImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
    }
    touchStartX.current = null;
  };

  // Extract Amazon specs/ingredients/features from description
  const parsedDetails = useMemo(() => {
    const desc = isAr ? product.descriptionAr : (product.descriptionEn || product.descriptionAr) || '';
    const isPerfume = Boolean(product.category?.includes('عطر') || product.categoryEn?.toLowerCase().includes('perfume'));
    const isAccessory = Boolean(
      product.category?.includes('شعر') ||
      product.category?.includes('إكسسوار') ||
      product.category?.includes('مجوهرات') ||
      product.categoryEn?.toLowerCase().includes('jewelry') ||
      product.categoryEn?.toLowerCase().includes('accessories')
    );

    // Extract bullet points (lines starting with •, -, or *)
    const lines = desc.split('\n').map((l) => l.trim()).filter(Boolean);
    const bullets = lines
      .filter((l) => l.startsWith('•') || l.startsWith('-') || (l.startsWith('*') && !l.includes('أبرز المميزات')))
      .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean);

    return {
      isPerfume,
      isAccessory,
      bullets,
      title: isPerfume
        ? isAr
          ? 'النوتات والتركيبة العطرية'
          : 'Fragrance Notes & Composition'
        : isAccessory
        ? isAr
          ? 'الخامات والمواصفات التفصيلية'
          : 'Materials & Specifications'
        : isAr
        ? 'المكونات الفعالة والمميزات'
        : 'Active Ingredients & Highlights',
    };
  }, [product, isAr]);

  // Recommended products strictly prioritized from the SAME category
  const relatedProducts = useMemo(() => {
    const sameCat = liveProducts.filter(
      (p) =>
        p.id !== product.id &&
        ((product.category && p.category === product.category) ||
          (product.categoryEn && p.categoryEn === product.categoryEn))
    );
    const backfill = liveProducts.filter(
      (p) => p.id !== product.id && !sameCat.some((sc) => sc.id === p.id)
    );
    return [...sameCat, ...backfill].slice(0, 4);
  }, [liveProducts, product]);

  const currentStock = variant?.stock ?? product.stock ?? 12;

  return (
    <div className="roma-container pt-3 pb-8 md:py-12 text-[#F9FAFB]" dir={dir}>
      {/* Top Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/shop"
          data-testid="link-back-shop"
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:border-[#D4A5A5] hover:text-white transition"
          aria-label="Back to Shop"
        >
          <ArrowRight className={`size-4.5 ${isAr ? '' : 'rotate-180'}`} />
        </Link>

        <div className="text-center">
          <span className="font-display text-xs md:text-sm font-bold text-[#A1A1AA] uppercase tracking-widest">
            ROMA ATELIER · {isAr ? 'مستحضرات وإكسسوارات فاخرة' : 'Haute Cosmetics'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:border-[#D4A5A5] hover:text-white transition"
          >
            <Share2 className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-pressed={favorited}
            onClick={() => toggleWishlist(product.id)}
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-white hover:border-[#D4A5A5] transition"
            aria-label="Wishlist"
          >
            <Heart
              className={`size-4 ${favorited ? 'fill-[#D4A5A5] text-[#D4A5A5]' : 'text-[#A1A1AA]'}`}
              strokeWidth={1.5}
            />
          </button>
          <Link
            href="/cart"
            className="relative flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:text-white hover:border-[#D4A5A5] transition active:scale-95"
            aria-label="Cart"
          >
            <ShoppingBag className="size-4.5 text-[#D4A5A5]" strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#D4A5A5] text-[9px] font-bold text-[#0A0A0A] font-mono">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="grid gap-5 md:grid-cols-2 md:gap-14 items-start">
        {/* Left Column: Amazon-Style Touch-Swipeable Gallery */}
        <div className="space-y-3 sm:space-y-4">
          <div
            className="relative aspect-square w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#141414] flex items-center justify-center shadow-xl group select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Ambient blur backdrop to ensure seamless blending without black side gaps */}
            <div
              className="absolute inset-0 bg-center bg-cover blur-2xl opacity-20 scale-125 pointer-events-none"
              style={{ backgroundImage: `url(${galleryImages[selectedImage] || product.imageUrl})` }}
            />

            <img
              src={galleryImages[selectedImage] || product.imageUrl}
              alt={displayName}
              onError={(e) => {
                const target = e.currentTarget;
                if (product.imageUrl?.startsWith('/uploads/') && !target.src.includes('raw.githubusercontent.com')) {
                  target.src = `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public${product.imageUrl}`;
                } else {
                  target.src = '/logo-white-bg.png';
                }
              }}
              className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badge */}
            {displayBadge && (
              <span className="absolute top-3.5 right-3.5 z-20 rounded-full bg-[#D4A5A5]/20 text-[#D4A5A5] border border-[#D4A5A5]/30 text-[10px] font-semibold px-2 py-0.5 shadow-md">
                {displayBadge}
              </span>
            )}

            {/* Swipe hint dots for mobile */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#0A0A0A]/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                {galleryImages.map((_, i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full transition-all ${
                      selectedImage === i ? 'bg-[#D4A5A5] w-2.5' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sleek Image Gallery Thumbnails directly underneath */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-13 h-13 sm:w-16 sm:h-16 rounded-xl overflow-hidden border transition-all shrink-0 p-0.5 bg-[#141414] ${
                    selectedImage === idx
                      ? 'border-[#D4A5A5] shadow-md shadow-[#D4A5A5]/20 ring-1 ring-[#D4A5A5]'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (img?.startsWith('/uploads/') && !target.src.includes('raw.githubusercontent.com')) {
                        target.src = `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public${img}`;
                      } else {
                        target.src = '/logo-white-bg.png';
                      }
                    }}
                    className="h-full w-full object-contain rounded-lg p-0.5"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Trust Value Badges under Image (Desktop Only - Mobile version placed beneath CTA) */}
          <div className="hidden md:grid grid-cols-4 gap-2 pt-2">
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#141414] border border-white/5 shadow-2xs">
              <Leaf className="size-4 text-[#D4A5A5] mb-1" />
              <span className="text-[10px] font-bold text-white">{isAr ? '١٠٠٪ طبيعي' : '100% Organic'}</span>
              <span className="text-[9px] text-[#A1A1AA]">{isAr ? 'خالٍ من البارابين' : 'Toxin-Free'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#141414] border border-white/5 shadow-2xs">
              <Award className="size-4 text-[#D4A5A5] mb-1" />
              <span className="text-[10px] font-bold text-white">{isAr ? 'مسجل بالصحة' : 'MOH Registered'}</span>
              <span className="text-[9px] text-[#A1A1AA]">{isAr ? 'ترخيص جودة مصري' : 'Gov Certified'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#141414] border border-white/5 shadow-2xs">
              <Droplets className="size-4 text-[#D4A5A5] mb-1" />
              <span className="text-[10px] font-bold text-white">{isAr ? 'مختبر جلدياً' : 'Derm Tested'}</span>
              <span className="text-[9px] text-[#A1A1AA]">{isAr ? 'آمن للبشرة' : 'Sensitive Safe'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#141414] border border-white/5 shadow-2xs">
              <Truck className="size-4 text-[#D4A5A5] mb-1" />
              <span className="text-[10px] font-bold text-white">{isAr ? 'شحن ٢٤-٤٨ ساعة' : '24-48h Delivery'}</span>
              <span className="text-[9px] text-[#A1A1AA]">{isAr ? 'دفع عند الاستلام' : 'Cash on Delivery'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Pricing & Purchase Block */}
        <div className="space-y-3.5 sm:space-y-5 md:space-y-6">
          <div>
            <span className="font-mono-brand text-[11px] sm:text-xs font-bold tracking-widest text-[#D4A5A5] uppercase">
              {product.categoryEn || product.category}
            </span>
            <h1
              data-testid="text-product-name"
              className="mt-1 font-display text-base sm:text-xl md:text-3xl font-extrabold text-white leading-snug"
            >
              {displayName}
            </h1>

            {/* Ratings & Stock Badge */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2 py-0.5 rounded-full border border-white/10">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-white">{productRatingAvg}</span>
                <span className="text-[10px] text-[#A1A1AA]">({reviews.length} {isAr ? 'تقييم' : 'reviews'})</span>
              </div>

              {/* In Stock Badge */}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="size-3" />
                <span>{isAr ? 'متوفر في المخزون' : 'In Stock'}</span>
              </span>
            </div>

            {/* Price Row (Pure White Price) */}
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-mono-brand text-white">
                {formatPrice(product.price)}
              </span>
              {effectiveCompareAtPrice && effectiveCompareAtPrice > product.price && (
                <span className="text-sm text-[#A1A1AA] line-through font-mono-brand opacity-60">
                  {formatPrice(effectiveCompareAtPrice)}
                </span>
              )}
              {effectiveCompareAtPrice && effectiveCompareAtPrice > product.price && (
                <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] sm:text-xs font-bold shadow-xs">
                  {discountPercent ? `-${discountPercent}%` : (isAr ? `وفرتي ${effectiveCompareAtPrice - product.price} ج.م` : `Save ${effectiveCompareAtPrice - product.price} EGP`)}
                </span>
              )}
            </div>
          </div>

          {/* Purchase Action Block */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2.5">
              {/* Quantity Stepper */}
              <div className="flex items-center rounded-xl border border-white/10 bg-[#141414] p-0.5 shadow-xs h-10">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="size-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:bg-white/5 hover:text-white transition"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center font-mono-brand text-xs sm:text-sm font-bold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="size-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:bg-white/5 hover:text-white transition"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Secondary CTA: Add to Bag */}
              <button
                type="button"
                data-testid="button-add-to-cart"
                onClick={addToBag}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#D4A5A5]/40 text-[#D4A5A5] hover:bg-[#D4A5A5]/10 h-10 px-3 text-xs sm:text-sm font-bold transition active:scale-[0.99]"
              >
                <ShoppingBag className="size-3.5 text-[#D4A5A5]" />
                <span>
                  {addedNotice
                    ? isAr
                      ? '✓ تمت الإضافة'
                      : '✓ Added to Bag!'
                    : t('product.add_to_cart')}
                </span>
              </button>
            </div>

            {/* Primary CTA: High-emphasis Fast Cash Buy Now */}
            <button
              type="button"
              data-testid="button-buy-now"
              onClick={buyNowDirect}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F2A7A7] via-[#E99797] to-[#DF8C8C] text-white font-extrabold shadow-md shadow-rose-400/20 hover:brightness-105 h-11 sm:h-12 px-4 text-xs sm:text-sm transition active:scale-[0.99] tracking-wide"
            >
              <Zap className="size-4 text-white fill-white shrink-0" />
              <span className="text-white drop-shadow-xs font-bold">{isAr ? 'شراء الآن' : t('product.buy_now')}</span>
            </button>
          </div>

          {/* Reassurance Features */}
          <div className="rounded-xl border border-white/10 bg-[#141414] p-3 space-y-1.5 text-[11px] sm:text-xs text-[#A1A1AA]">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck className="size-3.5 text-[#D4A5A5] shrink-0" />
              <span>{isAr ? 'ضمان استبدال واسترجاع لمدة ١٤ يوماً' : '14-Day Hassle-Free Returns & Exchange'}</span>
            </div>
            <div className="flex items-center gap-2 text-white font-medium">
              <Truck className="size-3.5 text-[#D4A5A5] shrink-0" />
              <span>{isAr ? 'معاينة المنتج قبل الدفع للمندوب متاحة' : 'Inspect Product Upon Courier Delivery'}</span>
            </div>
          </div>

          {/* Trust Value Badges (Mobile-only here under purchase block) */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5 md:hidden">
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#141414] border border-white/5 shadow-2xs">
              <Leaf className="size-3.5 text-[#D4A5A5] mb-0.5" />
              <span className="text-[10px] font-bold text-white leading-tight">{isAr ? '١٠٠٪ طبيعي' : '100% Organic'}</span>
              <span className="text-[8.5px] text-[#A1A1AA] leading-tight mt-0.5">{isAr ? 'خالٍ من البارابين' : 'Toxin-Free'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#141414] border border-white/5 shadow-2xs">
              <Award className="size-3.5 text-[#D4A5A5] mb-0.5" />
              <span className="text-[10px] font-bold text-white leading-tight">{isAr ? 'مسجل بالصحة' : 'MOH Registered'}</span>
              <span className="text-[8.5px] text-[#A1A1AA] leading-tight mt-0.5">{isAr ? 'ترخيص جودة مصري' : 'Gov Certified'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#141414] border border-white/5 shadow-2xs">
              <Droplets className="size-3.5 text-[#D4A5A5] mb-0.5" />
              <span className="text-[10px] font-bold text-white leading-tight">{isAr ? 'مختبر جلدياً' : 'Derm Tested'}</span>
              <span className="text-[8.5px] text-[#A1A1AA] leading-tight mt-0.5">{isAr ? 'آمن للبشرة' : 'Sensitive Safe'}</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#141414] border border-white/5 shadow-2xs">
              <Truck className="size-3.5 text-[#D4A5A5] mb-0.5" />
              <span className="text-[10px] font-bold text-white leading-tight">{isAr ? 'شحن ٢٤-٤٨ ساعة' : '24-48h Delivery'}</span>
              <span className="text-[8.5px] text-[#A1A1AA] leading-tight mt-0.5">{isAr ? 'دفع عند الاستلام' : 'Cash on Delivery'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description, Ingredients, Ritual & Reviews */}
      <div className="mt-6 md:mt-12 border-t border-white/10 pt-5 md:pt-8">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 border-b border-white/10 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'desc'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-xs'
                : 'text-[#A1A1AA] hover:text-white bg-[#141414]'
            }`}
          >
            {t('pdp.tab_description')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2.5 rounded-full text-xs md:text-sm font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'ingredients'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-xs'
                : 'text-[#A1A1AA] hover:text-white bg-[#141414]'
            }`}
          >
            {parsedDetails.isAccessory
              ? isAr
                ? 'الخامات والمواصفات'
                : 'Materials & Specs'
              : parsedDetails.isPerfume
              ? isAr
                ? 'النوتات والتركيبة'
                : 'Fragrance Notes'
              : t('pdp.tab_ingredients')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('howTo')}
            className={`px-4 py-2.5 rounded-full text-xs md:text-sm font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'howTo'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-xs'
                : 'text-[#A1A1AA] hover:text-white bg-[#141414]'
            }`}
          >
            {t('pdp.tab_how_to_use')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-full text-xs md:text-sm font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-xs'
                : 'text-[#A1A1AA] hover:text-white bg-[#141414]'
            }`}
          >
            {t('pdp.tab_reviews')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTab === 'desc' && (
            <div className="prose prose-invert prose-sm max-w-none text-[#A1A1AA] leading-relaxed space-y-4">
              <p className="text-sm md:text-base leading-relaxed text-white/90 whitespace-pre-line">{displayDescription}</p>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4 text-sm text-[#A1A1AA]">
              <h3 className="font-display font-bold text-base text-white">
                {parsedDetails.title}
              </h3>

              {displayIngredients ? (
                <div className="leading-relaxed bg-[#141414] p-4 md:p-5 rounded-2xl border border-white/10 text-white/90 whitespace-pre-line">
                  {displayIngredients}
                </div>
              ) : parsedDetails.bullets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedDetails.bullets.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-white/10 bg-[#141414] flex items-start gap-2.5 text-white/90"
                    >
                      <Sparkles className="size-4 text-[#D4A5A5] shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm leading-relaxed">{b}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="leading-relaxed bg-[#141414] p-4 md:p-5 rounded-2xl border border-white/10 text-zinc-400">
                  <p className="text-xs md:text-sm leading-relaxed">
                    {isAr ? 'غير متوفر' : 'Not available'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'howTo' && (
            <div className="space-y-4 text-sm text-[#A1A1AA]">
              <h3 className="font-display font-bold text-base text-white">
                {isAr ? 'طريقة الاستخدام' : 'How to Use'}
              </h3>
              <div className="leading-relaxed bg-[#141414] p-4 rounded-2xl border border-white/10 text-white/90 whitespace-pre-line">
                {displayHowToUse ? (
                  <p>{displayHowToUse}</p>
                ) : (
                  <p className="text-zinc-400">{isAr ? 'غير متوفر' : 'Not available'}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    {isAr ? 'تجارب وآراء العميلات' : 'Verified Client Reviews'}
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    {productRatingAvg} {isAr ? 'من 5 نجوم · بناءً على' : 'out of 5 stars · based on'} {reviews.length} {isAr ? 'تقييمات موثقة' : 'verified reviews'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-white/10 bg-[#141414] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{rev.name}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 font-bold px-2 py-0.5 rounded-full border border-emerald-800/40">
                          {isAr ? '✓ مشترية موثقة' : '✓ Verified Buyer'}
                        </span>
                        {rev.city && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            • {rev.city}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-500">{rev.date}</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="size-3 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Products Carousel - Category Specific */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-white/10 pt-14">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-white md:text-3xl">
                {isAr ? 'المنتجات المقترحة لك' : 'Suggested Products for You'}
              </h3>
            </div>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category || product.categoryEn || '')}`}
              className="text-xs font-bold text-[#D4A5A5] hover:underline"
            >
              {isAr ? 'عرض الكل' : 'View All'}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}