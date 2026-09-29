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
    nameAr: "إكسسوارات الشعر", 
    nameEn: "Hair Accessories", 
    slug: "hair-accessories", 
    imageUrl: "/categories/cat-hair-accessories.png" 
  },
  { 
    id: 2, 
    nameAr: "إكسسوارات الإطلالة", 
    nameEn: "Look Accessories", 
    slug: "look-accessories", 
    imageUrl: "/categories/cat-look-accessories.png" 
  },
  { 
    id: 3, 
    nameAr: "مجوهرات اليد والعنق", 
    nameEn: "Hand & Neck Jewelry", 
    slug: "jewelry", 
    imageUrl: "/categories/cat-jewelry.png" 
  },
  { 
    id: 4, 
    nameAr: "المكياج والجمال", 
    nameEn: "Makeup & Beauty", 
    slug: "makeup", 
    imageUrl: "/categories/cat-makeup.png" 
  },
  { 
    id: 5, 
    nameAr: "العناية بالجسم والنعومة", 
    nameEn: "Body Care & Softness", 
    slug: "body-care", 
    imageUrl: "/categories/cat-body-care.png" 
  },
  { 
    id: 6, 
    nameAr: "العطور الفاخرة", 
    nameEn: "Luxury Perfumes", 
    slug: "perfumes", 
    imageUrl: "/categories/cat-perfumes.png" 
  },
];


export const PRODUCTS: Product[] = [
  {
    "id": 1790674372884,
    "nameAr": "عناية إيفا بالبشرة، مقشر الجسم الطبيعي للتألق، 250 جم",
    "slug": "prod-1790674372884",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 85,
    "compareAtPrice": 106,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790674370631.jpg",
    "additionalImages": [],
    "rating": 5,
    "reviewCount": 1,
    "badge": "جديد",
    "stock": 50,
    "variants": [
      {
        "id": 1,
        "nameAr": "الحجم القياسي",
        "hex": "#D4A5A5",
        "sku": "RM-1790674372884",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790674301053,
    "nameAr": "كريم للبشرة من ايفا مرطب بالصبار والبانثينول وفيتامين اي، 20 جرام",
    "slug": "prod-1790674301053",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 10,
    "compareAtPrice": 13,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790674297415.jpg",
    "additionalImages": [],
    "rating": 5,
    "reviewCount": 1,
    "badge": "جديد",
    "stock": 50,
    "variants": [
      {
        "id": 1,
        "nameAr": "الحجم القياسي",
        "hex": "#D4A5A5",
        "sku": "RM-1790674301053",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790635009787,
    "nameAr": "سوار حلزوني كليوباترا للنساء والفتيات من ام تي - ظهر ثعبان | مجوهرات ستانلس ستيل مطلية بالذهب | مناسب للارتداء اليومي الانيق | مقاس واحد يناسب الجميع",
    "slug": "prod-1790635009787",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 60,
    "compareAtPrice": 75,
    "category": "إكسسوارات ومجوهرات (Accessories)",
    "imageUrl": "/uploads/prod_1790634940435.jpg",
    "additionalImages": [
      "/uploads/prod_1790634941050.jpg",
      "/uploads/prod_1790634941767.jpg",
      "/uploads/prod_1790634942182.jpg",
      "/uploads/prod_1790634942611.jpg"
    ],
    "rating": 5,
    "reviewCount": 1,
    "badge": "جديد",
    "stock": 50,
    "variants": [
      {
        "id": 1,
        "nameAr": "الحجم القياسي",
        "hex": "#D4A5A5",
        "sku": "RM-1790635009787",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790619437667,
    "nameAr": "قلادة ذهبية للازواج من لوف اند كرافت، للنساء والرجال قلادة مطابقة مثالية للازواج، هدايا مجوهرات، نحاس، بدون احجار كريمة",
    "slug": "prod-1790619437667",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 75,
    "compareAtPrice": 94,
    "category": "إكسسوارات ومجوهرات (Accessories)",
    "imageUrl": "/uploads/prod_1790619421887.jpg",
    "additionalImages": [
      "/uploads/prod_1790619422444.jpg",
      "/uploads/prod_1790619422952.jpg",
      "/uploads/prod_1790619423528.jpg"
    ],
    "rating": 5,
    "reviewCount": 1,
    "badge": "جديد",
    "stock": 50,
    "variants": [
      {
        "id": 1,
        "nameAr": "الحجم القياسي",
        "hex": "#D4A5A5",
        "sku": "RM-1790619437667",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790505693985,
    "nameAr": "سيروم زيت الفيف اكسترا اورديناري من لوريال باريس لأنواع الشعر الجاف، 100 مل",
    "slug": "prod-1790505693985",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 390,
    "compareAtPrice": 488,
    "category": "سيروم وزيوت (Serums & Oils)",
    "imageUrl": "/uploads/prod_1790505693360.jpg",
    "rating": 5,
    "reviewCount": 1,
    "badge": "جديد",
    "stock": 50,
    "variants": [
      {
        "id": 1,
        "nameAr": "الحجم القياسي",
        "hex": "#D4A5A5",
        "sku": "RM-1790505693985",
        "stock": 50
      }
    ]
  }
];

export const DEFAULT_PRODUCTS: Product[] = PRODUCTS;

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
        if (Array.isArray(parsed) && parsed.length >= PRODUCTS.length) {
          return parsed;
        }
      }
    } catch (_) {}
    return PRODUCTS;
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      let candidateList: Product[] | null = null;

      // 1. Fetch directly from same-domain /products.json (Instant, 0 rate limits, zero CORS issues)
      try {
        const localRes = await fetch(`/products.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (localRes.ok) {
          const data = await localRes.json();
          if (Array.isArray(data) && data.length > 0) {
            candidateList = data;
          }
        }
      } catch (_) {}

      // 2. Fetch from /api/products serverless endpoint as high-reliability fallback
      if (!candidateList || candidateList.length < PRODUCTS.length) {
        try {
          const apiRes = await fetch(`/api/products?_t=${Date.now()}`, { cache: 'no-store' });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (Array.isArray(apiData) && apiData.length > 0) {
              if (!candidateList || apiData.length > candidateList.length) {
                candidateList = apiData;
              }
            }
          }
        } catch (_) {}
      }

      // 3. Fetch from GitHub Raw as secondary cloud fallback
      if (!candidateList || candidateList.length < PRODUCTS.length) {
        try {
          const ghRawRes = await fetch(
            `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public/products.json?_t=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (ghRawRes.ok) {
            const rawData = await ghRawRes.json();
            if (Array.isArray(rawData) && rawData.length > 0) {
              if (!candidateList || rawData.length > candidateList.length) {
                candidateList = rawData;
              }
            }
          }
        } catch (_) {}
      }

      if (isMounted) {
        const sourceToUse = candidateList && candidateList.length >= PRODUCTS.length ? candidateList : PRODUCTS;
        const finalProducts = sourceToUse.filter((p: any) => p && p.id && (p.id < 101 || p.id > 106));
        const jsonStr = JSON.stringify(finalProducts);
        setProducts(finalProducts);
        try {
          localStorage.setItem('roma_live_products', jsonStr);
        } catch (_) {}
      }
    }

    loadProducts();

    const onFocus = () => loadProducts();
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);

    const interval = setInterval(loadProducts, 5000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
      clearInterval(interval);
    };
  }, []);

  return products.length > 0 ? products : PRODUCTS;
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
