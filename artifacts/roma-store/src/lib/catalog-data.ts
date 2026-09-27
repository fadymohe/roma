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

export const DEFAULT_PRODUCTS: Product[] = [];

export const PRODUCTS: Product[] = [
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
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter((p: any) => p && p.id && (p.id < 101 || p.id > 106));
          return realOnly;
        }
      }
    } catch (_) {}
    return [];
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
            if (Array.isArray(parsed)) {
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
            if (Array.isArray(rawData)) {
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
            if (Array.isArray(data)) {
              candidateList = data;
            }
          }
        } catch (_) {}
      }

      if (isMounted) {
        const finalProducts = candidateList && Array.isArray(candidateList)
          ? candidateList.filter((p: any) => p && p.id && (p.id < 101 || p.id > 106))
          : [];
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
