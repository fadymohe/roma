export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  region: 'cairo_giza' | 'delta' | 'upper_egypt';
  regionNameAr: string;
  regionNameEn: string;
  rate: number;
}

export const MIN_ORDER_AMOUNT = 200;
export const FREE_SHIPPING_THRESHOLD = 500;

export const SHIPPING_RATES = {
  cairo_giza: 80,
  delta: 90,
  upper_egypt: 130,
} as const;

export const GOVERNORATES: Governorate[] = [
  // 1. القاهرة والجيزة — 80 ج.م
  {
    id: 'cairo',
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    region: 'cairo_giza',
    regionNameAr: 'القاهرة والجيزة',
    regionNameEn: 'Cairo & Giza',
    rate: 80,
  },
  {
    id: 'giza',
    nameAr: 'الجيزة',
    nameEn: 'Giza',
    region: 'cairo_giza',
    regionNameAr: 'القاهرة والجيزة',
    regionNameEn: 'Cairo & Giza',
    rate: 80,
  },

  // 2. الدلتا والإسكندرية ومدن القناة — 90 ج.م
  {
    id: 'alex',
    nameAr: 'الإسكندرية',
    nameEn: 'Alexandria',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'qalyubia',
    nameAr: 'القليوبية',
    nameEn: 'Qalyubia',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'dakahlia',
    nameAr: 'الدقهلية (المنصورة)',
    nameEn: 'Dakahlia (Mansoura)',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'gharbia',
    nameAr: 'الغربية (طنطا)',
    nameEn: 'Gharbia (Tanta)',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'sharqia',
    nameAr: 'الشرقية (الزقازيق)',
    nameEn: 'Sharqia (Zagazig)',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'monufia',
    nameAr: 'المنوفية (شبين الكوم)',
    nameEn: 'Monufia (Shibin El Kom)',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'beheira',
    nameAr: 'البحيرة (دمنهور)',
    nameEn: 'Beheira (Damanhur)',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'kafr_el_sheikh',
    nameAr: 'كفر الشيخ',
    nameEn: 'Kafr El Sheikh',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'damietta',
    nameAr: 'دمياط',
    nameEn: 'Damietta',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'port_said',
    nameAr: 'بورسعيد',
    nameEn: 'Port Said',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'ismailia',
    nameAr: 'الإسماعيلية',
    nameEn: 'Ismailia',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },
  {
    id: 'suez',
    nameAr: 'السويس',
    nameEn: 'Suez',
    region: 'delta',
    regionNameAr: 'الدلتا والقناة',
    regionNameEn: 'Delta & Canal',
    rate: 90,
  },

  // 3. الصعيد والغردقة والبحر الأحمر وسيناء — 130 ج.م
  {
    id: 'red_sea',
    nameAr: 'البحر الأحمر (الغردقة)',
    nameEn: 'Red Sea (Hurghada)',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'faiyum',
    nameAr: 'الفيوم',
    nameEn: 'Faiyum',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'beni_suef',
    nameAr: 'بني سويف',
    nameEn: 'Beni Suef',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'minya',
    nameAr: 'المنيا',
    nameEn: 'Minya',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'asyut',
    nameAr: 'أسيوط',
    nameEn: 'Asyut',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'sohag',
    nameAr: 'سوهاج',
    nameEn: 'Sohag',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'qena',
    nameAr: 'قنا',
    nameEn: 'Qena',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'luxor',
    nameAr: 'الأقصر',
    nameEn: 'Luxor',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'aswan',
    nameAr: 'أسوان',
    nameEn: 'Aswan',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'sinai',
    nameAr: 'جنوب سيناء (شرم الشيخ)',
    nameEn: 'South Sinai (Sharm El Sheikh)',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'north_sinai',
    nameAr: 'شمال سيناء',
    nameEn: 'North Sinai',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'matrouh',
    nameAr: 'مطروح والساحل الشمالي',
    nameEn: 'Matrouh & North Coast',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
  {
    id: 'new_valley',
    nameAr: 'الوادي الجديد',
    nameEn: 'New Valley',
    region: 'upper_egypt',
    regionNameAr: 'الصعيد والغردقة',
    regionNameEn: 'Upper Egypt & Hurghada',
    rate: 130,
  },
];

export function getShippingRate(govId: string): number {
  const gov = GOVERNORATES.find((g) => g.id === govId);
  return gov ? gov.rate : 80;
}

export function getGovernorate(govId: string): Governorate | undefined {
  return GOVERNORATES.find((g) => g.id === govId);
}
