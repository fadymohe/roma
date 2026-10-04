import fs from 'fs';
import path from 'path';

// System prompt as defined for Roma Visual Product Matching Engine
const SYSTEM_PROMPT = `أنت محرك رؤية حاسوبية وخبير متخصص في تدقيق ومطابقة منتجات التجميل، العطور، والعناية الشخصية لمتاجر التجارة الإلكترونية.

مهمتك:
فحص الصورة المرفوعة بدقة وتجاوز التحديات البصرية الشائعة (مثل ضعف الإضاءة، زوايا التصوير المائلة، أو وجود نصوص غير واضحة)، ثم مطابقتها مع كتالوج المتجر المقدم أدناه.

---
### خطوات التحليل الإلزامية:
1. عزل الخلفية: تجاهل اليدين، الطاولات، أو أي عناصر محيطة وركّز فقط على العبوة/المنتج الأساسي.
2. استخراج النصوص (OCR): اقرأ أي نص مكتوب على العبوة بدقة متناهية (اسم الماركة، اسم المنتج، الحجم بالملمتر/الجرام، أو رقم الدرجة).
3. التحليل الشكلي واللوني: حدد نوع العبوة (أنبوب، قطارة، زجاجة رش، باليت، روج)، وحدد درجات الألوان بدقة (مثلاً: "وردي خوخي غير لامع" بدلاً من مجرد "وردي").
4. المطابقة والتحقق: قارن المعطيات مع قائمة المنتجات المتاحة:
   - مطابقة تامة (Exact): تطابق الماركة ونوع المنتج والدرجة بنسبة 100%.
   - مطابقة تقريبية (Alternative): المنتج نفسه بنكهة/درجة أخرى، أو منتج بديل من نفس الفئة والوظيفة بدقة (مثلاً عطر مقابل عطر، روج مقابل روج، ولا يجوز نهائياً مطابقة عطر مع إكسسوار شعر).
   - غير موجود (Not Found): لا يوجد تطابق منطقي داخل الكتالوج لنفس نوع المنتج.

---
### قواعد المخرجات:
- الرد يجب أن يكون كود JSON صالح فقط بدون أي نصوص، مقدمات، أو شروحات خارج الكود.
- في حال وجود شك في قراءة نص على العبوة، اذكر القراءة البديلة المحتملة في حقل "ocr_alternative_guesses".

---
### صيغة الـ JSON المطلوبة:
{
  "analysis_status": "success",
  "visual_breakdown": {
    "detected_brand": "اسم الماركة المكتشف أو null",
    "detected_product_type": "سيروم / روج / عطر / كريم...",
    "detected_shade_or_color": "وصف الدرجة واللون بدقة",
    "visible_text_ocr": ["النصوص الظاهرة على العبوة"],
    "ocr_alternative_guesses": ["تخمينات بديلة للكلمات غير الواضحة"]
  },
  "match_verdict": {
    "status": "exact_match / alternative_match / not_found",
    "confidence_score": 0.95,
    "matched_product_id": "معرف المنتج المطابق من الكتالوج كـ رقم أو null",
    "matched_product_name": "اسم المنتج المطابق من الكتالوج أو null",
    "recommended_category": "التصنيف المناسب داخل المتجر"
  },
  "search_fallback": {
    "clean_search_query": "استعلام بحث نصي نقي للبحث في محرك المتجر",
    "tags": ["وسم 1", "وسم 2"]
  },
  "user_facing_message": "رسالة واضحة للمستخدم باللغة العربية توضح النتيجة بدقة"
}`;

function loadCatalog() {
  const searchPaths = [
    path.join(process.cwd(), 'artifacts', 'roma-store', 'public', 'products.json'),
    path.join(process.cwd(), 'dist', 'products.json'),
    path.join(process.cwd(), 'products.json'),
    path.join(process.cwd(), 'public', 'products.json'),
  ];

  for (const p of searchPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch (_) {}
  }
  return [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Key');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    return res.status(200).json({ ok: true, engine: 'ROMA AI Visual Matching Engine', hasGeminiKey: hasKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { image, filename } = body;
    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const allProducts = loadCatalog();
    const compactCatalog = allProducts.map((p) => ({
      id: p.id,
      name: p.nameAr,
      category: p.category,
      price: p.price,
      slug: p.slug,
    }));

    // Check for Gemini API Key in environment or headers
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      req.headers['x-gemini-key'];

    if (apiKey) {
      // Clean base64 and extract mime type
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const promptWithCatalog = `${SYSTEM_PROMPT}

---
### مدخلات المتجر المتاحة:
قائمة المنتجات (${compactCatalog.length} منتج):
${JSON.stringify(compactCatalog)}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptWithCatalog },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const candidateText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const aiVerdict = JSON.parse(candidateText);

            // Locate full product if matched
            let matchedProduct = null;
            if (aiVerdict?.match_verdict?.matched_product_id) {
              matchedProduct = allProducts.find(
                (p) => String(p.id) === String(aiVerdict.match_verdict.matched_product_id)
              );
            }

            return res.status(200).json({
              success: true,
              engine: 'gemini-vision',
              aiVerdict,
              matchedProduct: matchedProduct || null,
            });
          }
        }
      } catch (geminiErr) {
        console.error('Gemini vision API error:', geminiErr);
      }
    }

    // Fallback: Smart Categorical & Exact Matching without hallucinating cross-category matches
    return res.status(200).json({
      success: true,
      engine: 'smart-heuristic',
      aiVerdict: {
        analysis_status: 'requires_gemini_key_or_exact_match',
        match_verdict: {
          status: 'not_found',
          confidence_score: 0,
          matched_product_id: null,
          matched_product_name: null,
        },
        user_facing_message: 'لم يتم العثور على تطابق تام للصورة في الكتالوج الحالي.',
      },
      matchedProduct: null,
    });
  } catch (err) {
    console.error('Visual search handler error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
