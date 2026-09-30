import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFilePromise = promisify(execFile);

// Helper to decode HTML entities
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

// Clean HTML tags and excessive whitespace
function stripHtml(html) {
  if (!html) return '';
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// Category Classifier by Product Name / Title
export function classifyCategory(breadcrumbs, title, description) {
  const n = `${title || ''}`.toLowerCase();

  // 1. Hair Accessories (إكسسوارات الشعر)
  if (/توك|توكة|توكه|ربط(ة|ه|ات)\s*شعر|استك|طوق|أطواق|اطواق|شريط\s*ر(أ|ا)س|عصاب|مشبك|مشابك|شابك|كليبس|بندان|باندانا|سكرانشي|scrunch|فيونك|كلبس|بنس|هير\s*بيس|دبابيس|مشط|تاج/i.test(n)) {
    return 'إكسسوارات الشعر';
  }

  // 2. Look Accessories (إكسسوارات الإطلالة - احزمة، شنط، نظارات، ساعات، شالات)
  if (/حزام|أحزمة|احزمة|نظار|حقيب|شنط|محفظ|محافظ|ساع(ة|ه|ات)|watch|bag|handbag|crossbody|سكارف|شال|شالات|إشارب|ايشارب|كاب|قبع|إبزيم|ابزيم|بروش/i.test(n)) {
    return 'إكسسوارات الإطلالة';
  }

  // 3. Hand & Neck Jewelry (مجوهرات اليد والعنق - سلاسل، خواتم، اساور، اقراط)
  if (/سلسل|سلاسل|قلاد|عقد|كولي|خاتم|خواتم|اسور|أساور|سوار|انسيال|حلق|أقراط|اقراط|خلخال|خلاخل|دلاي|مجوهرات|زركون|لؤلؤ/i.test(n)) {
    return 'مجوهرات اليد والعنق';
  }

  // 4. Luxury Perfumes (العطور الفاخرة)
  if (/عطر|عطور|برفان|بارفيوم|parfum|perfume|مسك|عود|بخور|كولونيا|او\s*(دي|دو)|eau\s*d|بودي\s*ميست|رذاذ\s*العطر/i.test(n)) {
    return 'العطور الفاخرة';
  }

  // 5. Makeup & Beauty (المكياج والجمال)
  if (/روج|أحمر\s*(شفاه|خدود)|احمر\s*(شفاه|خدود)|شفاه|ليب|lip|مسكر|ماسكارا|mascara|كحل|ايلاينر|آيلاينر|محدد|طلاء\s*أظافر|طلاء\s*اظافر|مانيكير|اظافر|أظافر|بلاشر|بلش|مورد|كونسيلر|فاونديشن|كريم\s*اساس|بودر|ايشادو|ظلال|هايلايتر|كونتور|برايمر|مكياج|makeup|فرش\s*مكياج|بيوتي\s*بلندر|منظم\s*مكياج|رموش|يولو|توب\s*كوت|بيس\s*شيلد|شيجلام|sheglam/i.test(n)) {
    return 'المكياج والجمال';
  }

  // 6. Body & Skin Care (العناية بالجسم والنعومة)
  return 'العناية بالجسم والنعومة';
}

// Fetch Amazon HTML using curl.exe directly via execFile (no shell expansion bugs)
async function fetchHtmlWithCurl(targetUrl) {
  const args = [
    '-s',
    '-L',
    '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '-H', 'Accept-Language: ar-EG,ar;q=0.9,en-US;q=0.8',
    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    '-H', 'sec-ch-ua: "Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    '-H', 'sec-ch-ua-mobile: ?0',
    '-H', 'sec-ch-ua-platform: "Windows"',
    '-H', 'sec-fetch-dest: document',
    '-H', 'sec-fetch-mode: navigate',
    '-H', 'sec-fetch-site: none',
    '-H', 'sec-fetch-user: ?1',
    '-H', 'upgrade-insecure-requests: 1',
    targetUrl
  ];

  try {
    const { stdout: html } = await execFilePromise('curl.exe', args, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 25000,
    });
    return html || '';
  } catch (err) {
    console.warn(`[AMAZON SCRAPER] curl error on ${targetUrl}:`, err.message);
    return '';
  }
}

// Main Amazon Scraping Function
export async function scrapeAmazonProduct(inputUrl) {
  try {
    // 1. Clean URL and normalize
    const urlMatch = inputUrl.match(/https?:\/\/[^\s]+/i);
    let targetUrl = urlMatch ? urlMatch[0] : inputUrl.trim();

    console.log(`[AMAZON SCRAPER] Initial Scraping URL: ${targetUrl}`);

    // If it's a long Amazon URL with ref or search parameters, clean it to canonical if ASIN is present
    const asinMatch = targetUrl.match(/\/(?:dp|gp\/product|d)\/([A-Z0-9]{10})/i);
    if (asinMatch && targetUrl.includes('amazon.')) {
      const asin = asinMatch[1];
      const domainMatch = targetUrl.match(/https?:\/\/(?:www\.)?(amazon\.[a-z.]+)/i);
      const domain = domainMatch ? domainMatch[1] : 'amazon.eg';
      targetUrl = `https://www.${domain}/dp/${asin}?language=ar_AE`;
      console.log(`[AMAZON SCRAPER] Normalized to canonical: ${targetUrl}`);
    } else if (targetUrl.includes('amazon.eg') && targetUrl.includes('/-/en/')) {
      targetUrl = targetUrl.replace('/-/en/', '/-/ar/');
    }

    // 2. Fetch page HTML
    let html = await fetchHtmlWithCurl(targetUrl);

    // If short URL (amzn.to or amzn.eu) was used, check if we need to resolve redirected ASIN
    if (!html || html.length < 500 || html.includes('validateCaptcha') || html.includes('Robot Check')) {
      console.log('[AMAZON SCRAPER] First fetch failed or blocked, attempting fallback...');
      // Try resolving redirect URL first
      try {
        const { stdout: effectiveUrl } = await execFilePromise('curl.exe', [
          '-s', '-L', '-o', 'NUL', '-w', '%{url_effective}', targetUrl
        ]);
        if (effectiveUrl && effectiveUrl !== targetUrl) {
          console.log(`[AMAZON SCRAPER] Redirected to: ${effectiveUrl}`);
          const redirAsinMatch = effectiveUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
          if (redirAsinMatch) {
            const canonicalUrl = `https://www.amazon.eg/dp/${redirAsinMatch[1]}?language=ar_AE`;
            html = await fetchHtmlWithCurl(canonicalUrl);
          } else {
            html = await fetchHtmlWithCurl(effectiveUrl);
          }
        }
      } catch (_) {}
    }

    if (!html || html.length < 500) {
      return { ok: false, error: 'تعذر تحميل الصفحة من أمازون، يرجى التأكد من صحة الرابط.' };
    }

    // 3. Extract Title (الاسم كامل)
    let title = '';
    const titleMatch = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i)
      || html.match(/<h1 id="title"[^>]*>([\s\S]*?)<\/h1>/i)
      || html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)
      || html.match(/<meta\s+name="title"\s+content="([^"]*)"/i)
      || html.match(/<meta\s+name="twitter:title"\s+content="([^"]*)"/i)
      || html.match(/<title>([\s\S]*?)<\/title>/i);

    if (titleMatch) {
      title = stripHtml(titleMatch[1]);
      // Remove trailing " : Amazon.eg" or "| Amazon"
      title = title.replace(/\s*[:|]\s*Amazon\..*$/i, '').trim();
      title = title.replace(/^Amazon\..*?:\s*/i, '').trim();
    }

    // If title is generic like "Amazon.eg" or "Robot Check", reject as not found
    if (!title || title.toLowerCase() === 'amazon.eg' || title.toLowerCase() === 'amazon.com' || title.includes('Robot Check')) {
      return { ok: false, error: 'لم يتم العثور على اسم المنتج في رابط أمازون، قد تكون الصفحة محمية أو الرابط غير مباشر.' };
    }

    // 4. Extract Price (السعر)
    let price = 0;
    const priceWholeMatch = html.match(/<span class="a-price-whole">([\d,]+)(?:<span class="a-price-decimal">\.?<\/span><span class="a-price-fraction">(\d+)<\/span>)?/i);
    const apexPriceMatch = html.match(/id="corePriceDisplay_desktop_feature_div"[\s\S]*?class="a-offscreen">([^<]+)<\/span>/i)
      || html.match(/class="apexPriceToPay"[\s\S]*?class="a-offscreen">([^<]+)<\/span>/i);
    const priceOffscreenMatch = html.match(/<span class="a-price[^"]*"[^>]*>[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i)
      || html.match(/class="a-offscreen">([^<]+)<\/span>/i);

    let rawPriceStr = '';
    if (priceWholeMatch) {
      const whole = priceWholeMatch[1].replace(/,/g, '');
      const frac = priceWholeMatch[2] || '0';
      rawPriceStr = `${whole}.${frac}`;
    } else if (apexPriceMatch) {
      rawPriceStr = apexPriceMatch[1];
    } else if (priceOffscreenMatch) {
      rawPriceStr = priceOffscreenMatch[1];
    } else {
      const currencyRegex = /(?:EGP|ج\.م|جنيه|LE|\$|SAR|AED)\s*([\d,]+(?:\.\d+)?)/i;
      const curMatch = html.match(currencyRegex);
      if (curMatch) {
        rawPriceStr = curMatch[1];
      }
    }

    if (rawPriceStr) {
      const cleaned = rawPriceStr.replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        price = Math.round(parsed);
      }
    }

    if (!price || price <= 0) {
      price = 180;
    }

    // 5. Extract Breadcrumbs & Category (الفئة)
    const breadcrumbsMatch = html.match(/<div id="wayfinding-breadcrumbs_feature_div"[^>]*>([\s\S]*?)<\/div>/i);
    let breadcrumbs = [];
    if (breadcrumbsMatch) {
      const links = [...breadcrumbsMatch[1].matchAll(/<a[^>]*class="[^"]*a-link-normal[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)];
      breadcrumbs = links.map((m) => stripHtml(m[1])).filter(Boolean);
    }

    // 6. Extract Feature Bullets (المميزات)
    const featureBulletsMatch = html.match(/<div id="feature-bullets"[^>]*>([\s\S]*?)<\/div>/i);
    let features = [];
    if (featureBulletsMatch) {
      const bullets = [...featureBulletsMatch[1].matchAll(/<span class="a-list-item"[^>]*>([\s\S]*?)<\/span>/gi)];
      features = bullets
        .map((m) => stripHtml(m[1]))
        .filter((b) => b && !b.includes('function(') && !b.includes('P.when(') && b.length > 3);
    }

    // 7. Extract Product Description (الوصف)
    const descMatch = html.match(/<div id="productDescription"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<div id="productDescription_feature_div"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)
      || html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);

    let rawDesc = '';
    if (descMatch) {
      rawDesc = stripHtml(descMatch[1]);
      if (rawDesc.includes('function(') || rawDesc.includes('P.when(')) {
        rawDesc = '';
      }
    }

    // Combine Description & Features into a beautiful, customer-facing text
    let descriptionAr = '';
    if (rawDesc && rawDesc.length > 10) {
      descriptionAr += `${rawDesc}\n\n`;
    } else {
      descriptionAr += `مستحضر فاخر عالي الجودة متوفر لدى متجر روما، مصمم بتركيبة مميزة وآمنة تلبي احتياجاتك اليومية بعناية فائقة.\n\n`;
    }

    if (features.length > 0) {
      descriptionAr += `✨ *أبرز المميزات:*\n`;
      features.forEach((feat) => {
        descriptionAr += `• ${feat}\n`;
      });
    }

    descriptionAr = descriptionAr.trim();

    // Classify Category
    const category = classifyCategory(breadcrumbs, title, descriptionAr);

    // 8. Extract Images (الصورة ومعرض الصور)
    let rawImages = [];

    // All data-a-dynamic-image occurrences
    const dynamicMatches = [...html.matchAll(/data-a-dynamic-image="([^"]+)"/gi)];
    for (const dm of dynamicMatches) {
      try {
        const jsonStr = decodeHtmlEntities(dm[1]);
        const parsed = JSON.parse(jsonStr);
        rawImages.push(...Object.keys(parsed));
      } catch (_) {}
    }

    // All data-old-hires attributes
    const oldHiresMatches = [...html.matchAll(/data-old-hires="([^"]+)"/gi)];
    for (const ohm of oldHiresMatches) {
      if (ohm[1]) rawImages.push(ohm[1]);
    }

    // Color Images JSON in scripts
    const colorImagesMatches = [...html.matchAll(/'colorImages':\s*\{\s*'initial':\s*(\[[\s\S]*?\])\s*\}/gi)];
    for (const cim of colorImagesMatches) {
      try {
        const list = JSON.parse(cim[1]);
        for (const item of list) {
          if (item.hiRes) rawImages.push(item.hiRes);
          else if (item.large) rawImages.push(item.large);
          else if (item.main && item.main[0]) rawImages.push(item.main[0]);
          else if (item.thumb) rawImages.push(item.thumb);
        }
      } catch (_) {}
    }

    // Landing Image or Meta Image fallbacks
    const metaImgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)
      || html.match(/<meta\s+name="twitter:image"\s+content="([^"]*)"/i);
    if (metaImgMatch && metaImgMatch[1]) {
      rawImages.push(metaImgMatch[1]);
    }

    const landingMatch = html.match(/<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i)
      || html.match(/<img[^>]*id="imgBlkFront"[^>]*src="([^"]+)"/i);
    if (landingMatch && landingMatch[1]) {
      rawImages.push(landingMatch[1]);
    }

    // Enhance images to ultra high-resolution and deduplicate
    const hiresImages = rawImages
      .filter((img) => img && typeof img === 'string' && img.startsWith('http'))
      .filter((img) => !img.includes('pixel') && !img.includes('transparent') && !img.includes('sprite'))
      .map((img) => img.replace(/\._[A-Z0-9_,]+_\./, '._AC_SL1500_.'))
      .filter((img, idx, arr) => arr.indexOf(img) === idx);

    console.log(`[AMAZON SCRAPER] Extracted ${hiresImages.length} images for: ${title.slice(0, 40)}...`);

    return {
      ok: true,
      data: {
        title,
        price,
        compareAtPrice: Math.round(price * 1.25),
        description: descriptionAr,
        features,
        category,
        breadcrumbs,
        images: hiresImages.length > 0 ? hiresImages : [
          'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85'
        ],
        originalUrl: targetUrl,
      },
    };
  } catch (err) {
    console.error('[AMAZON SCRAPER] Error:', err);
    return { ok: false, error: err.message };
  }
}

// Download remote Amazon images to local uploads directory
export async function downloadAmazonImages(imageUrls, uploadsDir, distUploadsDir) {
  const downloaded = [];
  const timestamp = Date.now();

  // Download up to 5 highest resolution images
  const targetUrls = imageUrls.slice(0, 5);

  for (let i = 0; i < targetUrls.length; i++) {
    const imgUrl = targetUrls[i];
    try {
      const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
      const fileName = `prod_amz_${timestamp}_${i + 1}${ext}`;
      const localPath = path.join(uploadsDir, fileName);
      const distPath = path.join(distUploadsDir, fileName);

      const res = await fetch(imgUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        fs.writeFileSync(localPath, buffer);
        try {
          fs.writeFileSync(distPath, buffer);
        } catch (_) {}

        downloaded.push(`/uploads/${fileName}`);
      } else {
        downloaded.push(imgUrl); // Fallback to direct URL
      }
    } catch (e) {
      console.warn(`[AMAZON SCRAPER] Failed downloading image ${i}:`, e.message);
      downloaded.push(imgUrl);
    }
  }

  return downloaded.length > 0 ? downloaded : imageUrls.slice(0, 5);
}
