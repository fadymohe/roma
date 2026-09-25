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
  { id: 1, nameAr: "الوجه (Face)", slug: "face", imageUrl: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85" },
  { id: 2, nameAr: "سيروم (Serum)", slug: "serum", imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85" },
  { id: 3, nameAr: "العناية بالبشرة (Skincare)", slug: "skincare", imageUrl: "https://images.unsplash.com/photo-1608248597359-59754f15d706?auto=format&fit=crop&w=800&q=85" },
  { id: 4, nameAr: "مرطبات (Moisturizers)", slug: "moisturizers", imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=85" },
  { id: 5, nameAr: "الشفاه (Lips)", slug: "lips", imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=85" },
  { id: 6, nameAr: "العطور والجسم (Body)", slug: "body", imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=85" },
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    nameAr: "كريم استعادة نضارة وترطيب الوجه — Face Recovery Cream",
    slug: "face-recovery-cream",
    descriptionAr: "تركيبة استعادة نضارة البشرة الغنية بمستخلصات الغابات الطبيعية وحمض الهيالورونيك، تمنح ترطيباً عميقاً وحماية يومية للبشرة دون أي إحساس دهني.",
    price: 145,
    compareAtPrice: 180,
    category: "الوجه (Face)",
    imageUrl: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 342,
    badge: "الأكثر طلباً",
    variants: [
      { id: 11, nameAr: "30 ml", hex: "#76A080", sku: "NRT-FRC-30", stock: 45 },
      { id: 12, nameAr: "50 ml", hex: "#4E7A5A", sku: "NRT-FRC-50", stock: 60 },
      { id: 13, nameAr: "100 ml", hex: "#2E583A", sku: "NRT-FRC-100", stock: 25 },
    ],
  },
  {
    id: 2,
    nameAr: "سيروم النياسيناميد وتضييق المسام — Glow Rituals Pore Refining Serum",
    slug: "pore-refining-serum",
    descriptionAr: "سيروم نقي بتركيز Niacinamide 10% + Zinc 1% لتنظيم الإفرازات الدهنية، تقليص مظهر المسام، ومنح بشرتكِ إشراقة نضرة وصافية.",
    price: 125,
    compareAtPrice: 150,
    category: "سيروم (Serum)",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=90",
    rating: 5.0,
    reviewCount: 289,
    badge: "نقاء 100%",
    variants: [
      { id: 21, nameAr: "30 ml", hex: "#76A080", sku: "GLW-PRS-30", stock: 50 },
      { id: 22, nameAr: "50 ml", hex: "#4E7A5A", sku: "GLW-PRS-50", stock: 35 },
    ],
  },
  {
    id: 3,
    nameAr: "سيروم الهيالورونيك فائق الترطيب — Glow Nature Hyaluronic Acid Serum",
    slug: "hyaluronic-acid-serum",
    descriptionAr: "سيروم ترطيب مائي مكثف يخترق أعماق البشرة ليملأ الخطوط الدقيقة ويمنح حاجز البشرة مرونة وانتعاشاً فائقاً يدوم طوال اليوم.",
    price: 135,
    compareAtPrice: 165,
    category: "سيروم (Serum)",
    imageUrl: "https://images.unsplash.com/photo-1608248597359-59754f15d706?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 215,
    badge: "جديد وحصري",
    variants: [
      { id: 31, nameAr: "30 ml", hex: "#76A080", sku: "GLW-HAS-30", stock: 40 },
      { id: 32, nameAr: "50 ml", hex: "#4E7A5A", sku: "GLW-HAS-50", stock: 30 },
    ],
  },
  {
    id: 4,
    nameAr: "غسول الوجه المرطب والمنقي — Glow Nature Hydrating Cleanser",
    slug: "hydrating-face-cleanser",
    descriptionAr: "غسول رغوي نباتي لطيف يزيل الشوائب والمكياج مع الحفاظ الكامل على الرطوبة الطبيعية ومستويات الترطيب المتوازنة.",
    price: 95,
    compareAtPrice: 120,
    category: "الوجه (Face)",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=90",
    rating: 4.8,
    reviewCount: 178,
    badge: "لطيف للبشرة",
    variants: [
      { id: 41, nameAr: "100 ml", hex: "#E8EFEA", sku: "GLW-HFC-100", stock: 55 },
      { id: 42, nameAr: "200 ml", hex: "#DEE6E0", sku: "GLW-HFC-200", stock: 40 },
    ],
  },
  {
    id: 5,
    nameAr: "مرطب التغذية النباتية المكثف — Botanical Moisture Cream",
    slug: "botanical-moisture-cream",
    descriptionAr: "كريم ترطيب مخملي بخلاصة زبدة الشيا وزيت الجوجوبا، يعيد بناء الحاجز الواقي للبشرة ويمنحها نعومة فائقة وإشراقة طبيعية.",
    price: 115,
    compareAtPrice: 140,
    category: "مرطبات (Moisturizers)",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 164,
    badge: "ترطيب 24 ساعة",
    variants: [
      { id: 51, nameAr: "50 ml", hex: "#76A080", sku: "BOT-BMC-50", stock: 42 },
      { id: 52, nameAr: "100 ml", hex: "#4E7A5A", sku: "BOT-BMC-100", stock: 28 },
    ],
  },
  {
    id: 6,
    nameAr: "بلسم الشفاه العضوي المرطب — Natural Botanical Lip Balm",
    slug: "natural-botanical-lip-balm",
    descriptionAr: "بلسم نباتي نقي بزيت الورد وشمع العسل وفيتامين E، يرطب الشفاه بعمق ويحميها من الجفاف مع لمسة لمعان طبيعية جذابة.",
    price: 65,
    compareAtPrice: 85,
    category: "الشفاه (Lips)",
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 195,
    badge: "طبيعي 100%",
    variants: [
      { id: 61, nameAr: "ورد نقي", hex: "#C74375", sku: "LIP-NBL-01", stock: 60 },
      { id: 62, nameAr: "توت طبيعي", hex: "#8E2B4B", sku: "LIP-NBL-02", stock: 35 },
    ],
  },
  {
    id: 7,
    nameAr: "عطر ورذاذ الغابات النقية — Roma Forest Mist",
    slug: "roma-forest-mist",
    descriptionAr: "عطر طبيعي منعش مستوحى من أشجار الصنوبر والأعشاب الجبلية وأزهار البرغموت الإيطالية، يمنحكِ هدوءاً وانتعاشاً فاخراً طوال اليوم.",
    price: 185,
    compareAtPrice: 220,
    category: "العطور والجسم (Body)",
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1000&q=90",
    rating: 5.0,
    reviewCount: 142,
    badge: "إصدار ملكي",
    variants: [
      { id: 71, nameAr: "50 ml", hex: "#4E7A5A", sku: "RFM-01", stock: 25 },
      { id: 72, nameAr: "100 ml", hex: "#2E583A", sku: "RFM-02", stock: 30 },
    ],
  },
  {
    id: 8,
    nameAr: "إكسير الزيوت النباتية المغذي للوجه — Golden Glow Facial Oil",
    slug: "golden-glow-facial-oil",
    descriptionAr: "مزيج ذهبي فاخر من زيت ثمر الورد وزيت الأرجان وزيت المارولا، يغذي البشرة الجافة ويعيد لها الحيوية والبريق الصحي.",
    price: 155,
    compareAtPrice: 190,
    category: "العناية بالبشرة (Skincare)",
    imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=1000&q=90",
    rating: 4.9,
    reviewCount: 223,
    badge: "نقاء عضوي",
    variants: [
      { id: 81, nameAr: "30 ml", hex: "#D4AF37", sku: "GFO-30", stock: 38 },
    ],
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "سارة المهدي",
    quote: "كريم استعادة النضارة غير ملمس بشرتي تماماً خلال أسبوعين. الملمس خفيف وسريع الامتصاص، والتوصيل كان فائق السرعة!",
    rating: 5,
  },
  {
    id: 2,
    name: "نورا القحطاني",
    quote: "سيروم النياسيناميد من أفضل السيرومات الطبيعية التي جربتها، خفف مظهر المسام وأعطى بشرتي لمعة صحية جداً.",
    rating: 5,
  },
  {
    id: 3,
    name: "ياسمين عادل",
    quote: "التغليف فاخر والمنتجات نقية ورائحتها طبيعية مهدئة للأعصاب. أصبحت زبونة دائمة لمتجر روما بالتأكيد.",
    rating: 5,
  },
  {
    id: 4,
    name: "مريم الشريف",
    quote: "تجربة الشراء والطلب غاية في السلاسة. وصلني إشعار فوري بحالة الطلب والتغليف وصل بحالة ممتازة.",
    rating: 5,
  },
];
