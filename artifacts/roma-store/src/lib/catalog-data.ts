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

// Default products removed as requested - filled dynamically via Telegram Bot
export const PRODUCTS: Product[] = [];

/**
 * Hook to load dynamic products updated via Telegram Bot
 */
export function useLiveProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  useEffect(() => {
    fetch(`/products.json?t=${Date.now()}`)
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch products.json, using default:', err);
      });
  }, []);

  return products;
}

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
