import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const productsJsonPath = path.join(rootDir, 'artifacts', 'roma-store', 'public', 'products.json');
const distProductsJsonPath = path.join(rootDir, 'dist', 'products.json');
const catalogTsPath = path.join(rootDir, 'artifacts', 'roma-store', 'src', 'lib', 'catalog-data.ts');
const syncJsonPath = path.join(rootDir, 'products-sync.json');

const rawProducts = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
console.log(`Original products count: ${rawProducts.length}`);

// Category Classifier by Product Name (Arabic)
function classifyByName(name) {
  const n = (name || '').toLowerCase();

  // 1. Hair Accessories (إكسسوارات الشعر)
  if (/توك|توكة|توكه|ربط(ة|ه|ات)\s*شعر|استك|طوق|أطواق|اطواق|شريط\s*ر(أ|ا)س|عصاب|مشبك|مشابك|شابك|كليبس|بندان|باندانا|سكرانشي|scrunch|فيونك|كلبس|بنس|هير\s*بيس|دبابيس|مشط|تاج/i.test(n)) {
    return { nameAr: 'إكسسوارات الشعر', nameEn: 'Hair Accessories', slug: 'hair-accessories' };
  }

  // 2. Look Accessories (إكسسوارات الإطلالة - أحزمة، حقائب، نظارات، ساعات، شالات)
  if (/حزام|أحزمة|احزمة|نظار|حقيب|شنط|محفظ|محافظ|ساع(ة|ه|ات)|watch|bag|handbag|crossbody|سكارف|شال|شالات|إشارب|ايشارب|كاب|قبع|إبزيم|ابزيم|بروش/i.test(n)) {
    return { nameAr: 'إكسسوارات الإطلالة', nameEn: 'Look Accessories', slug: 'look-accessories' };
  }

  // 3. Hand & Neck Jewelry (مجوهرات اليد والعنق - سلاسل، خواتم، أساور، أقراط، خلاخل)
  if (/سلسل|سلاسل|قلاد|عقد|كولي|خاتم|خواتم|اسور|أساور|سوار|انسيال|حلق|أقراط|اقراط|خلخال|خلاخل|دلاي|مجوهرات|زركون|لؤلؤ/i.test(n)) {
    return { nameAr: 'مجوهرات اليد والعنق', nameEn: 'Hand & Neck Jewelry', slug: 'jewelry' };
  }

  // 4. Luxury Perfumes (العطور الفاخرة)
  if (/عطر|عطور|برفان|بارفيوم|parfum|perfume|مسك|عود|بخور|كولونيا|او\s*(دي|دو)|eau\s*d|بودي\s*ميست|رذاذ\s*العطر/i.test(n)) {
    return { nameAr: 'العطور الفاخرة', nameEn: 'Luxury Perfumes', slug: 'perfumes' };
  }

  // 5. Makeup & Beauty (المكياج والجمال)
  if (/روج|أحمر\s*(شفاه|خدود)|احمر\s*(شفاه|خدود)|شفاه|ليب|lip|مسكر|ماسكارا|mascara|كحل|ايلاينر|آيلاينر|محدد|طلاء\s*أظافر|طلاء\s*اظافر|مانيكير|اظافر|أظافر|بلاشر|بلش|مورد|كونسيلر|فاونديشن|كريم\s*اساس|بودر|ايشادو|ظلال|هايلايتر|كونتور|برايمر|مكياج|makeup|فرش\s*مكياج|بيوتي\s*بلندر|منظم\s*مكياج|رموش|يولو|توب\s*كوت|بيس\s*شيلد|شيجلام|sheglam/i.test(n)) {
    return { nameAr: 'المكياج والجمال', nameEn: 'Makeup & Beauty', slug: 'makeup' };
  }

  // 6. Body & Skin Care (العناية بالجسم والنعومة)
  return { nameAr: 'العناية بالجسم والنعومة', nameEn: 'Body Care & Softness', slug: 'body-care' };
}

// Deduplicate: preserve first occurrence (latest), remove duplicate occurrences
const seen = new Set();
const uniqueProducts = [];
let duplicatesRemoved = 0;

for (const p of rawProducts) {
  const normTitle = (p.nameAr || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normTitle) continue;

  if (seen.has(normTitle)) {
    duplicatesRemoved++;
    continue;
  }
  seen.add(normTitle);

  // Classify product based on its Arabic title
  const cat = classifyByName(p.nameAr);
  p.category = cat.nameAr;
  p.categoryEn = cat.nameEn;

  uniqueProducts.push(p);
}

console.log(`Duplicates removed: ${duplicatesRemoved}`);
console.log(`Unique products remaining: ${uniqueProducts.length}`);

// Category breakdown
const breakdown = {};
for (const p of uniqueProducts) {
  breakdown[p.category] = (breakdown[p.category] || 0) + 1;
}
console.log('Category breakdown:', breakdown);

// Save to public/products.json
fs.writeFileSync(productsJsonPath, JSON.stringify(uniqueProducts, null, 2), 'utf8');
console.log(`Saved clean products to ${productsJsonPath}`);

// Save to dist/products.json
if (fs.existsSync(path.dirname(distProductsJsonPath))) {
  fs.writeFileSync(distProductsJsonPath, JSON.stringify(uniqueProducts, null, 2), 'utf8');
  console.log(`Saved clean products to ${distProductsJsonPath}`);
}

// Update catalog-data.ts
if (fs.existsSync(catalogTsPath)) {
  let catalogContent = fs.readFileSync(catalogTsPath, 'utf8');
  const jsonStr = JSON.stringify(uniqueProducts, null, 2);
  catalogContent = catalogContent.replace(
    /export const PRODUCTS: Product\[\] = \[[\s\S]*?\];/,
    `export const PRODUCTS: Product[] = ${jsonStr};`
  );
  fs.writeFileSync(catalogTsPath, catalogContent, 'utf8');
  console.log(`Updated PRODUCTS in ${catalogTsPath}`);
}

// Update products-sync.json
const syncInfo = {
  lastSync: new Date().toISOString(),
  totalProducts: uniqueProducts.length,
  lastAction: `Deduplicated products: removed ${duplicatesRemoved} duplicates, kept ${uniqueProducts.length} unique products classified by name into 6 categories.`,
};
fs.writeFileSync(syncJsonPath, JSON.stringify(syncInfo, null, 2), 'utf8');
console.log(`Updated sync info in ${syncJsonPath}`);
