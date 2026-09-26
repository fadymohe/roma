import { useState, useEffect } from 'react';

export interface Variant {
  id: number;
  nameAr: string;
  nameEn?: string;
  hex: string;
  sku: string;
  stock: number;
}

export interface Product {
  id: number;
  nameAr: string;
  nameEn?: string;
  slug: string;
  descriptionAr: string;
  descriptionEn?: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  categoryEn?: string;
  imageUrl: string;
  additionalImages?: string[];
  rating: number;
  reviewCount: number;
  badge: string | null;
  badgeEn?: string | null;
  variants: Variant[];
  ingredientsAr?: string;
  ingredientsEn?: string;
  howToUseAr?: string;
  howToUseEn?: string;
  stock?: number;
}

export interface Category {
  id: number;
  nameAr: string;
  nameEn: string;
  slug: string;
  imageUrl: string;
}

export const CATEGORIES: Category[] = [
  { 
    id: 1, 
    nameAr: "الوجه والمكياج", 
    nameEn: "Face & Makeup", 
    slug: "face", 
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=85" 
  },
  { 
    id: 2, 
    nameAr: "السيروم والنضارة", 
    nameEn: "Serums & Glow", 
    slug: "serum", 
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85" 
  },
  { 
    id: 3, 
    nameAr: "العناية بالبشرة", 
    nameEn: "Skincare Rituals", 
    slug: "skincare", 
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85" 
  },
  { 
    id: 4, 
    nameAr: "المرطبات والمخمل", 
    nameEn: "Silk Moisturizers", 
    slug: "moisturizers", 
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=85" 
  },
  { 
    id: 5, 
    nameAr: "أحمر الشفاه المخملي", 
    nameEn: "Velvet Lips", 
    slug: "lips", 
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=85" 
  },
  { 
    id: 6, 
    nameAr: "إكسسوارات نسائية فاخرة", 
    nameEn: "Fine Accessories", 
    slug: "accessories", 
    imageUrl: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=800&q=85" 
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 101,
    nameAr: "سيروم النضارة الذهبي بفيتامين C وحمض الهيالورونيك (50ml)",
    nameEn: "24K Golden Radiance Vitamin C & Hyaluronic Serum (50ml)",
    slug: "golden-radiance-vitamin-c-serum",
    descriptionAr: "تركيبة حصرية فائقة النقاء تمنح بشرتكِ إشراقة فورية ونضارة مخملية تدوم طوال اليوم. معزز بجزيئات الذهب عيار ٢٤ قيراط وفيتامين سي المركز لمحاربة التصبغات وتوحيد لون البشرة.",
    descriptionEn: "An opulent, ultra-pure elixir that imparts immediate velvet luminosity and deep hydration. Infused with 24K gold flakes, stabilized Vitamin C, and triple-weight hyaluronic acid to correct uneven tone and awaken cellular radiance.",
    price: 345,
    compareAtPrice: 420,
    category: "serum",
    categoryEn: "Serums & Glow",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85",
    additionalImages: [
      "https://images.unsplash.com/photo-1608248597359-59754f15d706?auto=format&fit=crop&w=800&q=85",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85"
    ],
    rating: 4.9,
    reviewCount: 148,
    badge: "الأكثر مبيعاً ✨",
    badgeEn: "Bestseller ✨",
    stock: 7,
    ingredientsAr: "فيتامين C نقي (15%)، حمض الهيالورونيك الثلاثي، جزيئات ذهب عيار 24، مستخلص الورد الجوري، نياسيناميد (3%)، فيتامين E.",
    ingredientsEn: "Pure Vitamin C (15%), Triple-Weight Hyaluronic Acid, 24K Gold Flakes, Damask Rose Hydrosol, Niacinamide (3%), Natural Tocopherol (Vitamin E).",
    howToUseAr: "ضعي 3 إلى 4 قطرات على بشرة نظيفة وجافة صباحاً ومساءً. دلكي بلطف بحركات دائرية لأعلى حتى تمتصه البشرة تماماً قبل وضع المرطب.",
    howToUseEn: "Apply 3-4 drops morning and evening onto cleansed, dry skin. Gently massage upward in circular motions until fully absorbed before your moisturizer.",
    variants: [
      { id: 1, nameAr: "حجم قياسي 50ml", nameEn: "Standard 50ml", hex: "#E8A598", sku: "ROMA-SERUM-50", stock: 7 },
      { id: 2, nameAr: "حجم توفيري فاخر 100ml", nameEn: "Deluxe 100ml", hex: "#D48B88", sku: "ROMA-SERUM-100", stock: 4 }
    ]
  },
  {
    id: 102,
    nameAr: "روج ROMA المخملي المطفي فائق الثبات — درجات حصرية",
    nameEn: "ROMA Velvet Matte Long-Lasting Lipstick — Signature Shades",
    slug: "roma-velvet-matte-lipstick",
    descriptionAr: "أحمر شفاه كريمي فاخر بلمسة نهائية مطفية كالحرير دون أي جفاف. غني بزبدة الشيا وزيت الجوجوبا ليمنح شفتيكِ تغطية كاملة ولوناً غنياً يدوم حتى ١٢ ساعة متواصلة.",
    descriptionEn: "A couture velvet-matte lipstick that glides effortlessly, delivering weightless, rich color with 12-hour comfortable wear. Enriched with botanical shea butter and golden jojoba oil to nourish while keeping lips irresistibly soft.",
    price: 195,
    compareAtPrice: 260,
    category: "lips",
    categoryEn: "Velvet Lips",
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=85",
    additionalImages: [
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=85",
      "https://images.unsplash.com/photo-1503236823255-94609f598e71?auto=format&fit=crop&w=800&q=85"
    ],
    rating: 5.0,
    reviewCount: 212,
    badge: "حصري 🔥",
    badgeEn: "Exclusive 🔥",
    stock: 12,
    ingredientsAr: "شمع النحل الطبيعي، زبدة الشيا النقية، زيت الجوجوبا العضوي، فيتامين E، أصباغ معدنية طبيعية فائقة النقاء.",
    ingredientsEn: "Organic Cera Alba (Beeswax), Butyrospermum Parkii (Shea) Butter, Simmondsia Chinensis (Jojoba) Oil, Pure Mineral Pigments, Tocopherol.",
    howToUseAr: "حددي الشفاه أولاً بحافة قلم الروج، ثم املئي الشفاه بتمريرة واحدة غنية. انتطري دقيقة واحدة ليثبت المظهر المخملي الساحر.",
    howToUseEn: "Outline the contours of your lips with the precision tip, then glide across for full velvet saturation. Allow 60 seconds to set into a transfer-proof finish.",
    variants: [
      { id: 10, nameAr: "روبي فيلفيت (Burgundy Red)", nameEn: "Ruby Velvet (Burgundy Red)", hex: "#4A1525", sku: "ROMA-LIP-01", stock: 8 },
      { id: 11, nameAr: "روز جولد نود (Rose Gold Nude)", nameEn: "Rose Gold Nude", hex: "#D48B88", sku: "ROMA-LIP-02", stock: 5 },
      { id: 12, nameAr: "كرز دافئ (Warm Cherry)", nameEn: "Warm Cherry", hex: "#8A1C36", sku: "ROMA-LIP-03", stock: 3 }
    ]
  },
  {
    id: 103,
    nameAr: "كريم استعادة النضارة والترطيب العميق بالحرير والبيبتيدات (60g)",
    nameEn: "Silk & Peptides Deep Moisture Restorative Soufflé (60g)",
    slug: "silk-peptides-restorative-cream",
    descriptionAr: "مرطب حريري بقوام سحري سريع الامتصاص، يعيد بناء حاجز البشرة الواقي ويحبس الرطوبة لمدة ٤٨ ساعة. يمنح ملمساً ناعماً فائق الرقة ومظهراً ممتلئاً مفعماً بالشباب.",
    descriptionEn: "A weightless whipped soufflé formulated with hydrolysed silk proteins and multi-peptides to fortify the lipid barrier, sealing in 48 hours of cellular moisture with zero greasy residue.",
    price: 285,
    compareAtPrice: 350,
    category: "moisturizers",
    categoryEn: "Silk Moisturizers",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=85",
    rating: 4.8,
    reviewCount: 94,
    badge: "جديد ✨",
    badgeEn: "New ✨",
    stock: 9,
    ingredientsAr: "بروتين الحرير الطبيعي، بيبتيدات النحاس، سيراميدات نباتية (1, 3, 6)، مستخلص الصبار، زيت الأرجان المغربي.",
    ingredientsEn: "Hydrolyzed Silk Protein, Copper Tripeptide-1, Plant-derived Ceramides (1, 3, 6-II), Aloe Barbadensis Leaf Juice, Cold-Pressed Moroccan Argan Oil.",
    howToUseAr: "دلكي كمية صغيرة بحجم حبة البازلاء على الوجه والرقبة بعد السيروم كل صباح ومساء.",
    howToUseEn: "Warm a pearl-sized amount between clean fingertips and gently press into face, neck, and décolleté morning and evening.",
    variants: [
      { id: 20, nameAr: "برطمان زجاجي فاخر 60g", nameEn: "Luxury Glass Jar 60g", hex: "#FDFBF7", sku: "ROMA-CRM-60", stock: 9 }
    ]
  },
  {
    id: 104,
    nameAr: "ماء الورد الدمشقي العضوي المقطر بالبخار (150ml) — بخاخ منعش",
    nameEn: "Organic Damask Rose Hydrosol Mist (150ml)",
    slug: "organic-damask-rose-hydrosol",
    descriptionAr: "تونر ومستحلب طبيعي مهدئ ومقبض للمسام، تم تقطيره من أجود بتلات الورد الدمشقي العضوي. يهدئ احمرار البشرة، يعيد توازن درجات الحموضة، ويمنح انتعاشاً ملكياً في أي وقت.",
    descriptionEn: "100% steam-distilled pure Rosa Damascena floral water. Tones pores, balances skin pH, calms irritation, and envelops the senses in fresh, delicate botanical mist.",
    price: 155,
    compareAtPrice: 190,
    category: "skincare",
    categoryEn: "Skincare Rituals",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
    rating: 4.9,
    reviewCount: 76,
    badge: "طبيعي ١٠٠٪ 🌿",
    badgeEn: "100% Organic 🌿",
    stock: 15,
    ingredientsAr: "ماء الورد الدمشقي المقطر بنسبة 100%، بدون كحول، بدون مواد حافظة كيميائية.",
    ingredientsEn: "100% Pure Steam-Distilled Rosa Damascena Flower Water. Alcohol-free, paraben-free, preservative-free.",
    howToUseAr: "رشي رذاذاً خفيفاً على الوجه بعد التنظيف كخطوة تونر، أو طوال اليوم فوق المكياج لتجديد الحيوية والترطيب.",
    howToUseEn: "Mist liberally over clean face and neck as a prep toner, or throughout the day over makeup to re-energize and hydrate.",
    variants: [
      { id: 30, nameAr: "بخاخ رشاش فاخر 150ml", nameEn: "Fine Mist Bottle 150ml", hex: "#E8A598", sku: "ROMA-MIST-150", stock: 15 }
    ]
  },
  {
    id: 105,
    nameAr: "طقم دبابيس ومشابك شعر اللؤلؤ والكريستال الملكي (٥ قطع)",
    nameEn: "Royal Pearl & Crystal Couture Hairpins Set (5 Pieces)",
    slug: "royal-pearl-crystal-hairpins-set",
    descriptionAr: "إكسسوار نسائي استثنائي مصنوع يدوياً من لؤلؤ المياه العذبة وكريستالات الزركونيا البراقة. يمنح تسريحة شعركِ لمسة أميرية ساحرة في المناسبات والسهرات الخاصة.",
    descriptionEn: "Handcrafted couture hair jewelry featuring luminous simulated freshwater pearls and pavé-set Austrian crystals plated in durable rose gold. The ultimate crowning touch for festive and bridal evenings.",
    price: 240,
    compareAtPrice: 320,
    category: "accessories",
    categoryEn: "Fine Accessories",
    imageUrl: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=800&q=85",
    rating: 5.0,
    reviewCount: 63,
    badge: "يدوي الصنع 💎",
    badgeEn: "Handcrafted 💎",
    stock: 4,
    ingredientsAr: "لؤلؤ مستزرع معالج، كريستال نمساوي، سبائك نحاسية مطلية بذهب الورد عيار 18 المقاوم لتغير اللون.",
    ingredientsEn: "Hand-selected simulated baroque pearls, faceted zirconia crystals, 18K rose gold-plated hypoallergenic brass alloy.",
    howToUseAr: "ثبتي المشابك بنعومة على جانب الشعر المنسدل أو في شينيون السهرة لمظهر أنيق لا يُنسى.",
    howToUseEn: "Slide effortlessly into cascading waves, braided crowns, or a sleek chignon for an instant statement of poise.",
    variants: [
      { id: 40, nameAr: "طقم لؤلؤ وذهب وردي (5 قطع)", nameEn: "Rose Gold & Pearl Set (5 pcs)", hex: "#D48B88", sku: "ROMA-ACC-01", stock: 4 }
    ]
  },
  {
    id: 106,
    nameAr: "بلاشر وبودرة الخدود المخملية بلوم بينك مع مرآة فاخرة",
    nameEn: "Bloom Rose Silk Velvet Cheek Blush with Compact Mirror",
    slug: "bloom-rose-silk-velvet-blush",
    descriptionAr: "بودرة خدود حريرية تمتزج بسلاسة مع بشرتكِ لتمنح وجنتيكِ توريداً طبيعياً وإشراقة صحية دافئة تدوم لساعات طويلة، مجهزة بعلبة ذهبية أنيقة مزودة بمرآة نقية.",
    descriptionEn: "Finely milled silk powder blush infused with micro-pearls that sculpts cheeks with a soft-focus radiant glow. Housed in a bespoke burgundy and rose gold compact with mirror.",
    price: 210,
    compareAtPrice: 270,
    category: "face",
    categoryEn: "Face & Makeup",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=85",
    rating: 4.9,
    reviewCount: 88,
    badge: "مخملي ✨",
    badgeEn: "Velvet Glow ✨",
    stock: 8,
    ingredientsAr: "ميكا طبيعية، مسحوق الحرير، زيت المورينجا العضوي، فيتامين E، أصباغ وردية نقية خالية من التلك الضار.",
    ingredientsEn: "Talc-Free Mica, Silk Powder, Organic Moringa Seed Oil, Vitamin E, Micronized Natural Pigments.",
    howToUseAr: "مرري فرشاة البلاشر على تفاحتي الخدين وادمجيهما باتجاه الصدغين للحصول على رفع فوري وتوريد دافئ.",
    howToUseEn: "Sweep gently with a fluffy brush onto apples of cheeks, blending upwards towards temples for a sculpted, lit-from-within flush.",
    variants: [
      { id: 50, nameAr: "بلوم روز (Bloom Rose)", nameEn: "Bloom Rose", hex: "#E8A598", sku: "ROMA-BLUSH-01", stock: 5 },
      { id: 51, nameAr: "بيتش نكتار (Peach Nectar)", nameEn: "Peach Nectar", hex: "#F2B8A0", sku: "ROMA-BLUSH-02", stock: 3 }
    ]
  }
];

export const PRODUCTS: Product[] = DEFAULT_PRODUCTS;

function decodeBase64Utf8(base64: string): string {
  try {
    const cleanB64 = base64.replace(/\s/g, '');
    const binary = atob(cleanB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    console.error('Failed to decode base64 utf-8:', err);
    return '';
  }
}

/**
 * Hook to load dynamic products updated via Telegram Bot with instant real-time synchronization
 * Automatically merges with DEFAULT_PRODUCTS if catalog is empty.
 */
export function useLiveProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('roma_live_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_PRODUCTS;
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      let candidateList: Product[] | null = null;

      // 1. Fetch directly from GitHub Contents API (Instant 0-sec sync right after bot commit)
      try {
        const ghApiRes = await fetch(
          `https://api.github.com/repos/fadymohe/roma/contents/artifacts/roma-store/public/products.json?ref=main&_t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (ghApiRes.ok) {
          const ghApiData = await ghApiRes.json();
          if (ghApiData && ghApiData.content && ghApiData.encoding === 'base64') {
            const decodedStr = decodeBase64Utf8(ghApiData.content);
            const parsed = JSON.parse(decodedStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              candidateList = parsed;
            }
          }
        }
      } catch (e) {}

      // 2. Fetch from GitHub Raw if API was rate-limited or failed
      if (!candidateList) {
        try {
          const ghRawRes = await fetch(
            `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public/products.json?v=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (ghRawRes.ok) {
            const rawData = await ghRawRes.json();
            if (Array.isArray(rawData) && rawData.length > 0) {
              candidateList = rawData;
            }
          }
        } catch (_) {}
      }

      // 3. Fetch from local /products.json as standard fallback
      if (!candidateList) {
        try {
          const localRes = await fetch(`/products.json?t=${Date.now()}`, { cache: 'no-store' });
          if (localRes.ok) {
            const data = await localRes.json();
            if (Array.isArray(data) && data.length > 0) {
              candidateList = data;
            }
          }
        } catch (_) {}
      }

      if (isMounted) {
        const finalProducts = (candidateList && candidateList.length > 0) ? candidateList : DEFAULT_PRODUCTS;
        const jsonStr = JSON.stringify(finalProducts);
        const currentStr = JSON.stringify(products);
        if (jsonStr !== currentStr) {
          setProducts(finalProducts);
          try {
            localStorage.setItem('roma_live_products', jsonStr);
          } catch (_) {}
        }
      }
    }

    loadProducts();

    const onFocus = () => loadProducts();
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);

    const interval = setInterval(loadProducts, 8000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
      clearInterval(interval);
    };
  }, []);

  return products;
}

export const TESTIMONIALS = [
  {
    id: 1,
    nameAr: "سارة المهدي — القاهرة، التجمع",
    nameEn: "Sara El-Mahdy — Cairo, New Cairo",
    quoteAr: "سيروم النضارة الذهبي أعاد لبشرتي الحيوية بعد أسبوع واحد فقط! التوصيل كان في اليوم التالي ومندوب التوصيل كان في غاية الذوق.",
    quoteEn: "The 24K Golden Radiance Serum restored my skin luminosity in just 7 days! Express delivery arrived next morning in pristine condition.",
    rating: 5,
    verified: true,
  },
  {
    id: 2,
    nameAr: "نورهان الشريف — الإسكندرية",
    nameEn: "Nourhan El-Sherif — Alexandria",
    quoteAr: "أحمر الشفاه المخملي لونه رائع وثابت طوال اليوم دون أن يسبب أي جفاف. التغليف فخم جداً وعلبة الروج كأنها قطعة مجوهرات.",
    quoteEn: "The velvet matte lipstick is utterly stunning! Rich pigment that truly lasts through dinner without drying. The packaging feels like haute jewelry.",
    rating: 5,
    verified: true,
  },
  {
    id: 3,
    nameAr: "مريم عبد الله — الجيزة، الشيخ زايد",
    nameEn: "Mariam Abdallah — Giza, Zayed",
    quoteAr: "كريم الحرير والبيبتيدات خفيف جداً وملمسه تحفة. سعيدة جداً بوجود براند مصري بهذه الجودة والأناقة العالمية.",
    quoteEn: "The silk cream texture is breathtaking — so light yet deeply nourishing. Proud to see an Egyptian brand executing with such luxury and grace.",
    rating: 5,
    verified: true,
  },
];
