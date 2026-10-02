import { Product } from '@/lib/catalog-data';

/**
 * Normalizes Arabic text for high-precision search:
 * - Removes diacritics (Tashkeel)
 * - Removes Tatweel (Kashida)
 * - Standardizes Alef variations (أ, إ, آ, ٱ -> ا)
 * - Standardizes Ta Marbuta (ة -> ه)
 * - Standardizes Ya and Alef Maksura (ى -> ي)
 * - Standardizes Hamzas (ؤ -> و, ئ -> ي)
 * - Removes punctuation and normalizes whitespace
 */
export function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Tashkeel (harakat)
    .replace(/\u0640/g, '') // Tatweel (ـ)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance for fuzzy matching typos
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Common Arabic synonyms, concepts, and intent dictionaries
 */
export const SYNONYM_DICTIONARY: Record<string, string[]> = {
  // Perfumes & Fragrances
  عطر: ['عطور', 'برفان', 'بارفيوم', 'مسك', 'عود', 'بخور', 'perfume', 'parfum', 'ميست', 'رذاذ', 'كولونيا'],
  عطور: ['عطر', 'برفان', 'بارفيوم', 'مسك', 'عود', 'perfume', 'parfum'],
  برفان: ['عطر', 'عطور', 'بارفيوم', 'perfume'],
  مسك: ['عطر', 'عود', 'مخمرية', 'مسك الطهارة'],
  عود: ['عطر', 'مسك', 'بخور'],

  // Skincare & Body
  سيروم: ['سيرم', 'مصل', 'serum', 'حمض', 'هيالورونيك', 'نياسيناميد'],
  سيرم: ['سيروم', 'serum'],
  كريم: ['مرطب', 'ترطيب', 'لوشن', 'cream'],
  مرطب: ['كريم', 'ترطيب', 'لوشن', 'جل'],
  غسول: ['منظف', 'صابون', 'cleanser', 'غسول وجه'],
  شامبو: ['بلسم', 'شعر', 'شامبو شعر', 'shampoo'],
  واقي: ['واقي شمس', 'صن بلوك', 'sunblock', 'sunscreen'],
  'صن بلوك': ['واقي شمس', 'كريم شمس'],

  // Makeup
  روج: ['احمر شفاه', 'أحمر شفاه', 'ليب ستيك', 'مات', 'lip', 'lipstick', 'تنت'],
  'احمر شفاه': ['روج', 'ليب ستيك', 'تنت'],
  ماسكارا: ['مسكرة', 'مسكرا', 'رموش', 'mascara'],
  مسكرة: ['ماسكارا', 'رموش', 'mascara'],
  كحل: ['ايلاينر', 'آيلاينر', 'محدد عيون', 'eyeliner'],
  ايلاينر: ['كحل', 'محدد عيون', 'eyeliner'],
  فاونديشن: ['كريم اساس', 'كريم أساس', 'فونديشن', 'foundation'],
  كونسيلر: ['خافي عيوب', 'خافي العيوب', 'concealer'],
  بلاشر: ['مورد خدود', 'احمر خدود', 'بلشر', 'blush'],

  // Hair Accessories
  توكة: ['توك', 'توكه', 'ربطة شعر', 'استك', 'طوق', 'بندانة', 'باندانا', 'سكرانشي', 'مشبك'],
  توك: ['توكة', 'ربطات شعر', 'مشابك', 'كلبسات'],
  بندانة: ['طوق', 'باندانا', 'عصابة رأس', 'شريط رأس'],
  طوق: ['طوق شعر', 'شريط رأس', 'بندانة'],
  مشبك: ['كلبس', 'كليبس', 'بنسة', 'دبوس شعر'],

  // Jewelry & Look
  سلسلة: ['سلاسل', 'عقد', 'قلادة', 'كوليه', 'necklace'],
  سلاسل: ['سلسلة', 'عقد', 'قلادة'],
  خاتم: ['خواتم', 'دبلة', 'محبس', 'ring'],
  خواتم: ['خاتم', 'دبل'],
  حلق: ['اقراط', 'أقراط', 'حلقان', 'earrings'],
  اقراط: ['حلق', 'حلقان'],
  اسورة: ['اساور', 'أساور', 'سوار', 'انسيال', 'انسيالات', 'bracelet'],
  خلخال: ['خلاخل', 'خلخال قدم'],
  نظارة: ['نظارات', 'شمسية', 'sunglasses'],
  شنطة: ['شنط', 'حقيبة', 'حقائب', 'crossbody', 'bag'],
  حزام: ['احزمة', 'أحزمة', 'belt'],
};

/**
 * Known store brands to boost
 */
export const STORE_BRANDS = [
  'لوريال', 'الفيف', 'صانسيلك', 'غارنييه', 'ايفا', 'سيروبيب', 'شيجلام',
  'لطافة', 'اجمل', 'جيس', 'كالفن كلاين', 'ستاركي', 'ذا باث لاند', 'ميلتون',
  'افنان', 'يولو', 'فازلين', 'نيفيا', 'دوف', 'اماندا', 'بورجوا', 'ميبلين'
];

export interface SearchIntent {
  categorySlug?: 'hair-accessories' | 'look-accessories' | 'jewelry' | 'makeup' | 'body-care' | 'perfumes';
  categoryAr?: string;
  isPerfume?: boolean;
  isHair?: boolean;
  isMakeup?: boolean;
  isCare?: boolean;
  isJewelry?: boolean;
  isLook?: boolean;
  brandDetected?: string;
  suggestedCorrection?: string;
  conceptKeywords: string[];
}

/**
 * Detects search intent and semantic concept
 */
export function detectSearchIntent(query: string): SearchIntent {
  const norm = normalizeArabic(query);
  const words = norm.split(' ').filter(Boolean);

  const intent: SearchIntent = {
    conceptKeywords: [],
  };

  // Check brands
  for (const brand of STORE_BRANDS) {
    const brandNorm = normalizeArabic(brand);
    if (norm.includes(brandNorm)) {
      intent.brandDetected = brand;
      break;
    }
  }

  // 1. Perfumes Intent
  if (/عطر|عطور|برفان|بارفيوم|parfum|perfume|مسك|عود|بخور|ميست|رذاذ|كولونيا|مخمريه/i.test(norm)) {
    intent.isPerfume = true;
    intent.categorySlug = 'perfumes';
    intent.categoryAr = 'العطور الفاخرة';
    intent.conceptKeywords.push('عطر', 'عطور', 'برفان', 'بارفيوم', 'مسك', 'عود');
  }
  // 2. Hair Care & Hair Accessories Intent
  else if (/توك|توكه|طوق|بندان|باندانا|سكرانش|مشبك|مشابك|كلبس|كليبس|بنس|شعر|شامبو|بلسم|سيروبيب|كيراتين|مشط|تاج|ربط(ه|ة)\s*شعر/i.test(norm)) {
    intent.isHair = true;
    if (/توك|طوق|بندان|كلبس|مشبك|بنس|سكرانش|تاج|مشط/i.test(norm)) {
      intent.categorySlug = 'hair-accessories';
      intent.categoryAr = 'إكسسوارات الشعر';
    } else {
      intent.categorySlug = 'body-care';
      intent.categoryAr = 'العناية بالشعر والجسم';
    }
    intent.conceptKeywords.push('شعر', 'شامبو', 'توكة', 'طوق');
  }
  // 3. Makeup & Beauty Intent
  else if (/مكياج|روج|شفاه|ليب|مسكر|ماسكارا|كحل|ايلاينر|بلاشر|كونسيلر|فاونديشن|بودر|ايشادو|ظلال|هايلايتر|شيجلام|sheglam|تنت|محدد/i.test(norm)) {
    intent.isMakeup = true;
    intent.categorySlug = 'makeup';
    intent.categoryAr = 'المكياج والجمال';
    intent.conceptKeywords.push('مكياج', 'روج', 'ماسكارا', 'شيجلام');
  }
  // 4. Skincare & Body Care Intent
  else if (/عنايه|عناية|جسم|ترطيب|مرطب|كريم|لوشن|سيروم|سيرم|غسول|مقشر|سكراب|صابون|واقي\s*شمس|صن\s*بلوك|فازلين|تفتيح|هيالورونيك/i.test(norm)) {
    intent.isCare = true;
    intent.categorySlug = 'body-care';
    intent.categoryAr = 'العناية بالجسم والنعومة';
    intent.conceptKeywords.push('عناية', 'ترطيب', 'سيروم', 'كريم');
  }
  // 5. Jewelry Intent
  else if (/مجوهرات|سلسل|سلاسل|عقد|قلاد|كولي|خاتم|خواتم|اسور|اساور|سوار|انسيال|حلق|اقراط|خلخال|زركون|لؤلؤ/i.test(norm)) {
    intent.isJewelry = true;
    intent.categorySlug = 'jewelry';
    intent.categoryAr = 'مجوهرات اليد والعنق';
    intent.conceptKeywords.push('سلسلة', 'خاتم', 'حلق', 'اسورة');
  }
  // 6. Look Accessories Intent
  else if (/حزام|احزم|نظار|حقيب|شنط|محفظ|ساع(ه|ة)|سكارف|شال|ايشارب|كاب|بروش/i.test(norm)) {
    intent.isLook = true;
    intent.categorySlug = 'look-accessories';
    intent.categoryAr = 'إكسسوارات الإطلالة';
    intent.conceptKeywords.push('شنطة', 'نظارة', 'حزام', 'ساعة');
  }

  // Check for typos and suggest corrections
  // e.g., "سيرم" -> "سيروم", "عطو" -> "عطور", "روجج" -> "روج", "مسكره" -> "ماسكارا"
  for (const word of words) {
    if (word === 'سيرم') intent.suggestedCorrection = 'سيروم';
    else if (word === 'عطو' || word === 'عطورر') intent.suggestedCorrection = 'عطور';
    else if (word === 'مسكره') intent.suggestedCorrection = 'ماسكارا';
    else if (word === 'برفيوم' || word === 'بيرفيوم') intent.suggestedCorrection = 'بارفيوم';
    else if (word === 'شانيل') intent.suggestedCorrection = 'عطور فاخرة';
    else if (word.length >= 4) {
      for (const target of ['سيروم', 'ماسكارا', 'شامبو', 'كونسيلر', 'فاونديشن', 'سلسلة']) {
        const dist = levenshteinDistance(word, target);
        if (dist === 1) {
          intent.suggestedCorrection = target;
          break;
        }
      }
    }
  }

  return intent;
}

/**
 * Removes negative / non-applicable phrases from description
 * e.g. "غير معطرة" (unscented) must NOT match "عطر"!
 */
export function sanitizeDescriptionForSearch(desc: string | null | undefined): string {
  if (!desc) return '';
  const norm = normalizeArabic(desc);
  return norm
    // Remove "غير معطر" and its forms
    .replace(/غير معطر[هة]?/g, ' ')
    .replace(/غير معطره مناسبه/g, ' ')
    .replace(/خال[يٍ]? من (ال)?(عطور|كحول|صابون|بارابين|سلفات)?/g, ' ')
    .replace(/بدون (عطر|رائحه|كحول)/g, ' ')
    .replace(/لا يسبب (حساسيه|تهيج)/g, ' ')
    .replace(/\s+/g, ' ');
}

export interface ScoredProduct {
  product: Product;
  score: number;
  matchReasons: string[];
}

export interface SearchResultSummary {
  results: Product[];
  intent: SearchIntent;
  totalFound: number;
  suggestedQuery?: string;
  categoryFilter?: string;
}

/**
 * Core smart search algorithm with AI-level semantic precision
 */
export function smartSearchProducts(
  products: Product[],
  query: string,
  categoryFilter: string = 'all'
): SearchResultSummary {
  const trimmed = query.trim();
  const intent = detectSearchIntent(trimmed);

  if (!trimmed && categoryFilter === 'all') {
    return {
      results: [],
      intent,
      totalFound: 0,
    };
  }

  const normQuery = normalizeArabic(trimmed);
  const qTokens = normQuery.split(' ').filter(token => token.length > 0);

  // Expand with synonyms
  const expandedTokens = new Set<string>(qTokens);
  qTokens.forEach(token => {
    if (SYNONYM_DICTIONARY[token]) {
      SYNONYM_DICTIONARY[token].forEach(syn => expandedTokens.add(normalizeArabic(syn)));
    }
  });

  const scoredProducts: ScoredProduct[] = [];

  for (const product of products) {
    let score = 0;
    const matchReasons: string[] = [];

    const normNameAr = normalizeArabic(product.nameAr);
    const normNameEn = (product.nameEn || '').toLowerCase();
    const normCat = normalizeArabic(product.category);
    const sanitizedDesc = sanitizeDescriptionForSearch(product.descriptionAr);
    const rawDesc = normalizeArabic(product.descriptionAr);

    // Check manual category filter from pills
    let matchesCategoryPill = true;
    if (categoryFilter === 'hair') {
      matchesCategoryPill = normCat.includes('شعر') || normCat.includes('hair');
    } else if (categoryFilter === 'makeup') {
      matchesCategoryPill = normCat.includes('مكياج') || normCat.includes('makeup') || normCat.includes('روج');
    } else if (categoryFilter === 'perfume') {
      matchesCategoryPill = normCat.includes('عطور') || normCat.includes('عطر') || normCat.includes('perfume');
    } else if (categoryFilter === 'care') {
      matchesCategoryPill = normCat.includes('عنايه') || normCat.includes('جسم') || normCat.includes('skin');
    }

    if (!matchesCategoryPill) {
      continue;
    }

    // If query is empty and category filter is set, show category items sorted naturally
    if (!trimmed) {
      scoredProducts.push({ product, score: 100, matchReasons: ['category-filter'] });
      continue;
    }

    // 1. Exact Title Match
    if (normNameAr === normQuery || normNameEn === trimmed.toLowerCase()) {
      score += 2000;
      matchReasons.push('exact-title');
    }

    // 2. Title Starts With Query
    if (normNameAr.startsWith(normQuery)) {
      score += 1000;
      matchReasons.push('title-starts-with');
    } else if (normNameAr.includes(normQuery)) {
      score += 650;
      matchReasons.push('title-contains-full-query');
    }

    // 3. Token-by-token matching in Title
    for (const token of qTokens) {
      const boundaryRegex = new RegExp(`(^|\\s)${token}(\\s|$)`, 'i');
      const prefixRegex = new RegExp(`(^|\\s)${token}`, 'i');

      if (boundaryRegex.test(normNameAr)) {
        score += 350;
        matchReasons.push(`title-word:${token}`);
      } else if (prefixRegex.test(normNameAr)) {
        score += 220;
        matchReasons.push(`title-prefix:${token}`);
      } else if (normNameAr.includes(token)) {
        score += 120;
        matchReasons.push(`title-substr:${token}`);
      }
    }

    // 4. English name match
    if (normNameEn.includes(trimmed.toLowerCase())) {
      score += 300;
      matchReasons.push('en-name-match');
    }

    // 5. Category Intent & Relevance Boosting
    if (intent.isPerfume) {
      if (normCat.includes('عطور') || product.category === 'العطور الفاخرة') {
        score += 850;
        matchReasons.push('perfume-category-boost');
      }
      // If user typed "عطر", strictly penalize non-perfumes that only have accidental substrings
      if (/شامبو|بلسم|غسول|توك|حزام/.test(normNameAr) && !normCat.includes('عطور')) {
        score -= 1000; // Demote shampoo, belts, etc.
      }
    } else if (intent.isHair) {
      if (normCat.includes('شعر') || normCat.includes('إكسسوارات الشعر')) {
        score += 600;
        matchReasons.push('hair-category-boost');
      }
    } else if (intent.isMakeup) {
      if (normCat.includes('مكياج') || product.category === 'المكياج والجمال') {
        score += 600;
        matchReasons.push('makeup-category-boost');
      }
    } else if (intent.isCare) {
      if (normCat.includes('عنايه') || normCat.includes('جسم')) {
        score += 500;
        matchReasons.push('care-category-boost');
      }
    } else if (intent.isJewelry) {
      if (normCat.includes('مجوهرات') || product.category === 'مجوهرات اليد والعنق') {
        score += 600;
        matchReasons.push('jewelry-category-boost');
      }
    } else if (intent.isLook) {
      if (normCat.includes('إطلالة') || normCat.includes('look')) {
        score += 600;
        matchReasons.push('look-category-boost');
      }
    }

    // 6. Direct Category Name Match with Query
    if (normCat.includes(normQuery)) {
      score += 450;
      matchReasons.push('category-direct-match');
    }

    // 7. Brand Match
    if (intent.brandDetected) {
      const brandNorm = normalizeArabic(intent.brandDetected);
      if (normNameAr.includes(brandNorm) || (product.descriptionAr && normalizeArabic(product.descriptionAr).includes(brandNorm))) {
        score += 400;
        matchReasons.push(`brand-match:${intent.brandDetected}`);
      }
    }

    // 8. Expanded Synonyms Matching
    for (const synToken of Array.from(expandedTokens)) {
      if (synToken !== normQuery && normNameAr.includes(synToken)) {
        score += 180;
        matchReasons.push(`synonym-title:${synToken}`);
      }
    }

    // 9. Negative Context Guard (CRITICAL FOR ELVIVE FIX!)
    // If the query word appears ONLY in negated context in raw description (e.g. "غير معطرة"),
    // heavily penalize so it NEVER shows up for perfume searches!
    for (const token of qTokens) {
      if (token === 'عطر' || token === 'عطور') {
        const hasNegativePerfume = /غير معطر[هة]?|خال[يٍ]? من (ال)?عطور?|بدون عطر/.test(rawDesc);
        const hasPositivePerfume = /عطر|عطور|برفان|بارفيوم|مسك|عود/.test(normNameAr) || normCat.includes('عطور');
        if (hasNegativePerfume && !hasPositivePerfume) {
          score -= 2000;
        }
      }
    }

    // 10. Sanitized Description Match (low weight, only for positive occurrences)
    for (const token of qTokens) {
      const tokenRegex = new RegExp(`(^|\\s)${token}(\\s|$)`, 'i');
      if (tokenRegex.test(sanitizedDesc)) {
        score += 35;
        matchReasons.push(`desc-word:${token}`);
      }
    }

    // 11. Fuzzy Match in Title for minor typos (only for queries length >= 3)
    if (score < 100 && normQuery.length >= 3) {
      const titleWords = normNameAr.split(' ');
      for (const tWord of titleWords) {
        if (Math.abs(tWord.length - normQuery.length) <= 1) {
          const dist = levenshteinDistance(tWord, normQuery);
          if (dist === 1) {
            score += 150;
            matchReasons.push('fuzzy-title-match');
            break;
          }
        }
      }
    }

    if (score > 0) {
      scoredProducts.push({ product, score, matchReasons });
    }
  }

  // Sort descending by score, then by rating/popularity
  scoredProducts.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.product.rating || 0) - (a.product.rating || 0);
  });

  return {
    results: scoredProducts.map(s => s.product),
    intent,
    totalFound: scoredProducts.length,
    suggestedQuery: intent.suggestedCorrection,
  };
}

/**
 * Helper to highlight matching characters in a title
 */
export function getHighlightedParts(text: string, query: string): { text: string; isMatch: boolean }[] {
  if (!text || !query.trim()) return [{ text, isMatch: false }];

  const normQuery = normalizeArabic(query.trim());
  const normText = normalizeArabic(text);

  const index = normText.indexOf(normQuery);
  if (index === -1) {
    const firstToken = normQuery.split(' ')[0];
    if (firstToken && firstToken.length >= 2) {
      const tokenIdx = normText.indexOf(firstToken);
      if (tokenIdx !== -1) {
        return [
          { text: text.slice(0, tokenIdx), isMatch: false },
          { text: text.slice(tokenIdx, tokenIdx + firstToken.length), isMatch: true },
          { text: text.slice(tokenIdx + firstToken.length), isMatch: false },
        ].filter(p => p.text.length > 0);
      }
    }
    return [{ text, isMatch: false }];
  }

  return [
    { text: text.slice(0, index), isMatch: false },
    { text: text.slice(index, index + normQuery.length), isMatch: true },
    { text: text.slice(index + normQuery.length), isMatch: false },
  ].filter(p => p.text.length > 0);
}
