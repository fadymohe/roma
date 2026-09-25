export interface Variant {
  id: number;
  nameAr: string;
  hex: string;
  sku: string;
  stock: number;
}

export interface Product {
  id: number;
  nameAr: string;
  slug: string;
  descriptionAr: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  badge: string | null;
  variants: Variant[];
}

export interface Category {
  id: number;
  nameAr: string;
  slug: string;
  imageUrl: string;
}

export const CATEGORIES: Category[] = [
  { id: 1, nameAr: "أحمر الشفاه والقلوس", slug: "lipstick", imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85" },
  { id: 2, nameAr: "كريم الأساس والوجه", slug: "complexion", imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85" },
  { id: 3, nameAr: "العناية الفائقة بالبشرة", slug: "skincare", imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85" },
  { id: 4, nameAr: "البلاشر والهايلايتر", slug: "blush", imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=85" },
  { id: 5, nameAr: "مكياج العيون والرموش", slug: "eyes", imageUrl: "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=900&q=85" },
  { id: 6, nameAr: "العطور الفاخرة وبخاخات الجسم", slug: "fragrance", imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85" },
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    nameAr: "أحمر شفاه مات المخملي الفاخر — Velvet Matte",
    slug: "velvet-matte-lipstick",
    descriptionAr: "تركيبة مخملية فاخرة غنية بزيت الورد وزبدة الشيا، تمنح الشفاه لوناً ساحراً يدوم طوال اليوم بإحساس ناعم وخفيف.",
    price: 135,
    compareAtPrice: 160,
    category: "أحمر الشفاه والقلوس",
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 248,
    badge: "الأكثر طلباً",
    variants: [
      { id: 11, nameAr: "روزا كلاسيك", hex: "#C74375", sku: "BT-MATTE-01", stock: 35 },
      { id: 12, nameAr: "كشمير نود", hex: "#B97886", sku: "BT-MATTE-02", stock: 28 },
      { id: 13, nameAr: "توت مخملي", hex: "#8E2B4B", sku: "BT-MATTE-03", stock: 15 },
      { id: 14, nameAr: "سوفت بنك", hex: "#D45480", sku: "BT-MATTE-04", stock: 40 },
    ],
  },
  {
    id: 2,
    nameAr: "ملمع شفاه بلومينغ روز غلوس — Blooming Rose Gloss",
    slug: "blooming-rose-lip-gloss",
    descriptionAr: "ملمع شفاه فائق اللمعان بلمسة الورد والكرز، يمنح الشفاه امتلاءً فورياً وترطيباً عميقاً دون أي لزوجة.",
    price: 95,
    compareAtPrice: null,
    category: "أحمر الشفاه والقلوس",
    imageUrl: "https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=1000&q=90",
    rating: 4.8,
    reviewCount: 164,
    badge: "جديد وحصري",
    variants: [
      { id: 21, nameAr: "روزا بينك", hex: "#F3A5BC", sku: "BT-GLOSS-01", stock: 50 },
      { id: 22, nameAr: "روز جولد شيمر", hex: "#E8B4B8", sku: "BT-GLOSS-02", stock: 34 },
      { id: 23, nameAr: "بيتشي غلو", hex: "#EE9B87", sku: "BT-GLOSS-03", stock: 22 },
    ],
  },
  {
    id: 3,
    nameAr: "سيروم الورد المركز لإشراقة ونضارة البشرة",
    slug: "rose-glow-radiance-serum",
    descriptionAr: "إكسير نباتي وردي غني بخلاصة الورد الجوري وحمض الهيالورونيك والنياسيناميد لتوحيد لون البشرة واستعادة نضارتها الطبيعية.",
    price: 245,
    compareAtPrice: 290,
    category: "العناية الفائقة بالبشرة",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=90",
    rating: 5.0,
    reviewCount: 312,
    badge: "نقاء 100%",
    variants: [],
  },
  {
    id: 4,
    nameAr: "كريم أساس سيلك جلو — Silk Glow Foundation",
    slug: "silk-glow-all-day-foundation",
    descriptionAr: "فاونديشن حريري خفيف يندمج بسلاسة ليمنح تغطية طبيعية متوازنة تحافظ على إشراقة بشرتك طوال اليوم بدون لمعان دهني.",
    price: 195,
    compareAtPrice: null,
    category: "كريم الأساس والوجه",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 195,
    badge: "مقاوم للتعرق",
    variants: [
      { id: 41, nameAr: "عاجي وردي 01", hex: "#F5DDD5", sku: "BT-FD-01", stock: 20 },
      { id: 42, nameAr: "بيج دافئ 02", hex: "#E7BEA7", sku: "BT-FD-02", stock: 30 },
      { id: 43, nameAr: "قمحي مشرق 03", hex: "#D8A68B", sku: "BT-FD-03", stock: 25 },
      { id: 44, nameAr: "كراميل ناعم 04", hex: "#BA8466", sku: "BT-FD-04", stock: 18 },
    ],
  },
  {
    id: 5,
    nameAr: "بلاشر كريمي سوفت بيتال — Soft Petal Cream Blush",
    slug: "soft-petal-cream-blush",
    descriptionAr: "بلاشر كريمي مخملي يذوب فوراً على الخدود والشفاه ليمنح توريداً وردياً نضراً مفعماً بالحيوية.",
    price: 110,
    compareAtPrice: 130,
    category: "البلاشر والهايلايتر",
    imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 142,
    badge: "الأكثر مبيعاً",
    variants: [
      { id: 51, nameAr: "بيتال روز", hex: "#E46988", sku: "BT-BLUSH-01", stock: 27 },
      { id: 52, nameAr: "كاندي بينك", hex: "#F0849D", sku: "BT-BLUSH-02", stock: 33 },
      { id: 53, nameAr: "بيتش جلو", hex: "#E98571", sku: "BT-BLUSH-03", stock: 19 },
    ],
  },
  {
    id: 6,
    nameAr: "باليت ظلال عيون روز إلكسير — Rose Elixir Palette",
    slug: "rose-elixir-eyeshadow-palette",
    descriptionAr: "تسع درجات متناغمة من درجات النود، الروز جولد البرّاق، والألوان الترابية الساحرة لابتكار إطلالات يومية ومسائية متميزة.",
    price: 215,
    compareAtPrice: 250,
    category: "مكياج العيون والرموش",
    imageUrl: "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=1000&q=90",
    rating: 4.8,
    reviewCount: 98,
    badge: "إصدار خاص",
    variants: [],
  },
  {
    id: 7,
    nameAr: "ماسكارا إكستريم فوليوم سوبر بلاك",
    slug: "extreme-volume-black-mascara",
    descriptionAr: "فرشاة مخصصة لتكثيف وتطويل الرموش شعرة بشعرة مع تركيبة سوداء فاحمة مقاومة للتلطخ طوال اليوم.",
    price: 105,
    compareAtPrice: null,
    category: "مكياج العيون والرموش",
    imageUrl: "https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 220,
    badge: "ثبات 24 ساعة",
    variants: [],
  },
  {
    id: 8,
    nameAr: "كريم ترطيب وتغذية كولاجين الورد — Rose Collagen Hydra",
    slug: "rose-collagen-hydra-cream",
    descriptionAr: "كريم ترطيب فائق الغنى بالكولاجين النباتي وخلاصة زهرة الكاميليا لترميم حاجز البشرة وترطيبها بعمق.",
    price: 180,
    compareAtPrice: 210,
    category: "العناية الفائقة بالبشرة",
    imageUrl: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=90",
    rating: 4.7,
    reviewCount: 89,
    badge: "ترطيب عميق",
    variants: [],
  },
  {
    id: 9,
    nameAr: "عطر مسك آند روز الفاخر الأيقوني",
    slug: "signature-musk-rose-perfume",
    descriptionAr: "توقيعنا العطري الأيقوني: عبير يفيض بنفحات الورد الجوري الفاخر، المسك الأبيض، ودفء الفانيليا والكهرمان النقي.",
    price: 320,
    compareAtPrice: 380,
    category: "العطور الفاخرة وبخاخات الجسم",
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=90",
    rating: 5.0,
    reviewCount: 410,
    badge: "العطر الأيقوني",
    variants: [],
  },
  {
    id: 10,
    nameAr: "ماء ورد وبخاخ تثبيت المكياج المنعش — Rose Refresh Mist",
    slug: "rose-refresh-setting-mist",
    descriptionAr: "رذاذ منعش مهدئ غني بماء الورد النقي والصبار لتثبيت المكياج أو تجديد ترطيب البشرة وإشراقتها خلال اليوم.",
    price: 85,
    compareAtPrice: 105,
    category: "العناية الفائقة بالبشرة",
    imageUrl: "https://images.unsplash.com/photo-1608248597359-0a56e6db3f3b?auto=format&fit=crop&w=1000&q=90",
    rating: 4.8,
    reviewCount: 115,
    badge: "نباتي 100%",
    variants: [],
  },
];

export const TESTIMONIALS = [
  { id: 1, name: "ياسمين محمود", quote: "أحمر شفاه روزا كلاسيك صار روتيني اليومي، ثباته خيالي وما يجفف الشفايف نهائياً والتغليف فاخر جداً!", rating: 5 },
  { id: 2, name: "ندى الشريف", quote: "سيروم الورد المركز أعطى بشرتي نضارة واضحة من أول استخدام، ريحته تفتح النفس وملمسه خفيف وغير دهني.", rating: 5 },
  { id: 3, name: "مريم عادل", quote: "عطر مسك آند روز كل ما أحطه يسألوني عنه! ثبات فواح يدوم بالساعات، وتوصيل سريع وممتاز جداً.", rating: 5 },
  { id: 4, name: "هدى السعيد", quote: "الفاونديشن تغطيته حريرية وخفيفة جداً كأنه بشرة طبيعية ومناسب للجو تماماً، والمنتجات وصلت في وقت قياسي.", rating: 5 },
];
