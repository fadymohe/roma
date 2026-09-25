import { useState, useEffect } from 'react';

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

// Live products synced from Telegram bot
export const PRODUCTS: Product[] = [
  {
    "id": 1790380415314,
    "nameAr": "منديل مبلله",
    "slug": "prod-1790380415314",
    "descriptionAr": "مستحضر طبيعي مميز وفاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 250,
    "compareAtPrice": 313,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790380414882.jpg",
    "rating": 5,
    "reviewCount": 1,
    "badge": "جديد",
    "variants": [
      {
        "id": 1,
        "nameAr": "الحجم القياسي",
        "hex": "#76A080",
        "sku": "RM-1790380415314",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790377483235,
    "nameAr": "كريم تفتح البشرة من روما",
    "slug": "prod-1790377483235",
    "descriptionAr": "كريم تفتيح وتوحيد لون البشرة من روما (Roma Skin Brightening Cream)\nاستعيدي إشراقة بشرتك الطبيعية مع كريم التفتيح المتطور من روما. صُمم بتركيبة فعّالة وخفيفة تعمل على تقليل مظهر البقع الداكنة والتصبغات الناتجة عن أشعة الشمس أو آثار الحبوب، ليمنحك بشرة نضرة، متجانسة وأكثر حيوية.\nالمميزات والفوائد\nتفتيح وتوحيد اللون: يساعد على تلاشي التصبغات والبقع الداكنة لتوحيد لون البشرة تدريجياً وبأمان.\nإشراقة ونضارة فورية: يمنح الوجه توهجاً طبيعياً ومظهراً صحياً خالياً من البهتان.\nترطيب عميق: يدعم حاجز الرطوبة الطبيعي للبشرة دون أن يترك أثراً دهنياً أو لزجاً.\nسريع الامتصاص: قوام انسيابي ناعم يتغلغل بسرعة في طبقات الجلد ومناسب للاستخدام اليومي.\nمناسب لجميع أنواع البشرة: تركيبة لطيفة تم اختبارها للعناية بمختلف أنواع البشرة بما فيها البشرة الحساسة.",
    "price": 245,
    "compareAtPrice": 306,
    "category": "الوجه (Face)",
    "imageUrl": "/uploads/prod_1790377482618.jpg",
    "rating": 5,
    "reviewCount": 1,
    "badge": "جديد",
    "variants": [
      {
        "id": 1,
        "nameAr": "الحجم القياسي",
        "hex": "#76A080",
        "sku": "RM-1790377483235",
        "stock": 50
      }
    ]
  }
];

/**
 * Hook to load dynamic products updated via Telegram Bot
 */
export function useLiveProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      // 1. Try local products.json first
      try {
        const localRes = await fetch(`/products.json?t=${Date.now()}`);
        if (localRes.ok) {
          const data = await localRes.json();
          if (Array.isArray(data) && data.length > 0) {
            if (isMounted) setProducts(data);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch local products.json:', err);
      }

      // 2. Fallback to GitHub raw for instantaneous updates right after bot push
      try {
        const ghRes = await fetch(
          `https://raw.githubusercontent.com/fadymohe/roma/main/artifacts/roma-store/public/products.json?t=${Date.now()}`
        );
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (Array.isArray(ghData) && ghData.length > 0) {
            if (isMounted) setProducts(ghData);
          }
        }
      } catch (err) {
        console.warn('Could not fetch GitHub raw products.json:', err);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return products;
}

export const TESTIMONIALS = [
  {
    id: 1,
    name: "سارة المهدي",
    quote: "المنتجات ممتازة ورائحتها طبيعية ناعمة ووصلتني في وقت قياسي.",
    rating: 5,
  },
  {
    id: 2,
    name: "نورا القحطاني",
    quote: "التغليف فاخر وجودة التركيبة تنافس البراندات العالمية، تجربة رائعة.",
    rating: 5,
  },
];
