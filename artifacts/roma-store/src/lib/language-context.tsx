import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, defaultText?: string) => string;
  dir: 'rtl' | 'ltr';
  isAr: boolean;
  isEn: boolean;
  formatPrice: (amount: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Brand & General
    'brand.name': 'روما | ROMA',
    'brand.tagline': 'مستحضرات تجميل فاخرة وعناية استثنائية بالمرأة المصرية',
    'brand.currency': 'ج.م',
    'common.free_shipping_notice': 'شحن سريع مجاني لجميع محافظات مصر للطلبات فوق 500 ج.م ✨',
    'common.free_shipping_progress': 'أضيفي بقيمة {remaining} ج.م إضافية للحصول على شحن مجاني!',
    'common.free_shipping_qualified': 'مبروك! طلبكِ مؤهل الآن للشحن المجاني السريع 🚚✨',

    // Navigation
    'nav.home': 'الرئيسية',
    'nav.shop': 'المتجر والمنتجات',
    'nav.categories': 'الأقسام الفاخرة',
    'nav.face': 'الوجه والمكياج',
    'nav.serums': 'السيروم والنضارة',
    'nav.skincare': 'العناية بالبشرة',
    'nav.moisturizers': 'المرطبات والمخمل',
    'nav.lips': 'أحمر الشفاه',
    'nav.accessories': 'إكسسوارات نسائية',
    'nav.policies': 'سياسات المتجر',
    'nav.search_placeholder': 'ابحثي عن سيروم، روج مخملي، كريم ترطيب، أو إكسسوار...',
    'nav.wishlist': 'المفضلة',
    'nav.cart': 'سلة المشتريات',
    'nav.login': 'تسجيل الدخول',
    'nav.account': 'حسابي',

    // Hero Section
    'hero.badge': '✨ التشكيلة الحصرية لخريف وشتاء 2026',
    'hero.title_part1': 'جمالكِ المخملي يبدأ من',
    'hero.title_highlight': 'ROMA',
    'hero.description': 'تركيبات طبيعية فاخرة تم ابتكارها خصيصاً للمرأة المصرية العصرية. عناية ملكية بمكونات آمنة ومسجلة بوزارة الصحة.',
    'hero.cta_shop': 'تسوقي التشكيلة الحصرية',
    'hero.cta_story': 'اكتشفي أسرار تركيباتنا',
    'hero.stat_natural': '١٠٠٪ طبيعي ونقي',
    'hero.stat_delivery': 'شحن فوري ٢٤-٤٨ ساعة',
    'hero.stat_customers': '+١٥,٠٠٠ عميلة سعيدة',

    // Trust & Value Props
    'trust.organic_title': 'خلاصات طبيعية معتمدة',
    'trust.organic_desc': 'نقاء ١٠٠٪ خالٍ من البارابين والعطور الاصطناعية القاسية',
    'trust.fast_shipping_title': 'توصيل لباب المنزل',
    'trust.fast_shipping_desc': 'شحن فوري للقاهرة والجيزة وجميع محافظات مصر',
    'trust.cod_title': 'معاينة ودفع عند الاستلام',
    'trust.cod_desc': 'اطمئنان كامل مع إمكانية فحص طلبكِ قبل الدفع',
    'trust.moh_title': 'مسجل بوزارة الصحة',
    'trust.moh_desc': 'جميع المنتجات حاصلة على تراخيص الجودة المصرية المعتمدة',

    // Categories Section
    'section.categories_title': 'اكتشفي المجموعات الملكية',
    'section.categories_subtitle': 'مستحضرات صممت بعناية فائقة لتبرز أبهى تفاصيل أنوثتك',
    'section.bestsellers_title': 'الأكثر طلباً وتألقاً',
    'section.bestsellers_subtitle': 'المستحضرات التي نالت ثقة آلاف السيدات في مصر',

    // Product Card & Actions
    'product.add_to_cart': 'إضافة للسلة',
    'product.buy_now': 'شراء سريع كاش',
    'product.quick_view': 'نظرة سريعة',
    'product.in_stock': 'متوفر بالمخزون',
    'product.low_stock': 'متبقي {count} قطع فقط!',
    'product.out_of_stock': 'نفد من المخزون',
    'product.discount_tag': 'خصم {percent}%',
    'product.rating': '{rating} ({count} تقييم)',
    'product.shade': 'الدرجة:',
    'product.size': 'الحجم:',

    // Product Details Page
    'pdp.free_shipping_hint': 'شحن مجاني للطلبات فوق 500 ج.م',
    'pdp.fast_delivery_estimate': 'التوصيل المتوقع: خلال 24 - 48 ساعة للقاهرة والجيزة',
    'pdp.cod_available': 'الدفع عند الاستلام متاح (نقداً أو إنستاباي)',
    'pdp.easy_returns': 'استبدال واسترجاع خلال 14 يوماً وفق قانون حماية المستهلك',
    'pdp.tab_description': 'الوصف والتفاصيل',
    'pdp.tab_ingredients': 'المكونات الفعالة',
    'pdp.tab_how_to_use': 'طريقة الاستخدام المثالية',
    'pdp.tab_reviews': 'آراء وتجارب العميلات',
    'pdp.select_shade': 'اختاري الدرجة المناسبة لكِ:',
    'pdp.sticky_buy': 'شراء الآن (دفع عند الاستلام)',
    'pdp.sticky_cart': 'إضافة للسلة',
    'pdp.safety_guarantee': 'ضمان الجودة والسلامة: تم اختباره سريرياً من قبل أطباء الجلدية ومناسب للبشرة الحساسة.',

    // Cart Drawer & Page
    'cart.title': 'سلة المشتريات الفاخرة',
    'cart.empty_title': 'سلتكِ لا تزال بانتظاركِ',
    'cart.empty_subtitle': 'تصفحي مجموعاتنا الراقية واختاري ما يناسب جمالكِ وإشراقتكِ',
    'cart.start_shopping': 'ابدئي التسوق الآن',
    'cart.summary': 'ملخص الطلب',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.shipping': 'الشحن والتوصيل',
    'cart.shipping_free': 'مجاناً ✨',
    'cart.shipping_calc': '35 ج.م (شحن سريع)',
    'cart.total': 'المجموع الإجمالي',
    'cart.checkout_cta': 'المتابعة لتأكيد الطلب 🛍️',
    'cart.coupon_label': 'كود الخصم أو القسيمة',
    'cart.coupon_placeholder': 'أدخلي كود الخصم (مثل ROMA10)',
    'cart.coupon_apply': 'تطبيق الخصم',
    'cart.coupon_applied': 'تم تطبيق كود الخصم بنجاح!',

    // Single-Page Checkout
    'checkout.title': 'تأكيد الطلب والشحن السريع',
    'checkout.subtitle': 'أدخلي بيانات الشحن لتجهيز طلبكِ فورياً وشحنه إليكِ بعناية',
    'checkout.step_shipping': '١. بيانات الشحن والتوصيل',
    'checkout.full_name': 'الاسم بالكامل',
    'checkout.phone': 'رقم الهاتف / المحمول (واتساب)',
    'checkout.email': 'البريد الإلكتروني (لتتبع الشحنة)',
    'checkout.governorate': 'المحافظة',
    'checkout.address': 'العنوان بالتفصيل (المنطقة، الشارع، رقم العمارة)',
    'checkout.notes': 'ملاحظات إضافية للمندوب (اختياري)',
    'checkout.step_payment': '٢. طريقة الدفع المفضلة',
    'checkout.payment_cod': 'الدفع عند الاستلام (COD)',
    'checkout.payment_cod_desc': 'ادفعي نقداً أو عبر إنستاباي للمندوب عند استلام طلبكِ ومعاينته',
    'checkout.payment_wallet': 'محافظ إلكترونية / إنستاباي (InstaPay)',
    'checkout.payment_wallet_desc': 'فودافون كاش، أورنج كاش، اتصالات كاش، أو تحويل إنستاباي فوري',
    'checkout.payment_card': 'بطاقة بنكية (فيزا / ماستركارد / ميزة)',
    'checkout.payment_card_desc': 'دفع إلكتروني آمن ومشفر بأعلى معايير الحماية المصرفية',
    'checkout.confirm_order': 'تأكيد وإتمام الطلب الآن (الدفع عند الاستلام)',
    'checkout.submitting': 'جارٍ تسجيل طلبكِ وإرسال الإشعار...',
    'checkout.security_badge': '🔒 عملية شراء آمنة ١٠٠٪ ومحمية بتشفير عالي الأمان وبوابات دفع معتمدة',
    'checkout.turnstile_badge': '🛡️ محمي بواسطة Cloudflare Turnstile ضد البوتات والطلبات الوهمية',

    // Order Success
    'success.title': 'تم استلام وتأكيد طلبكِ بنجاح! 🎉',
    'success.order_number': 'رقم الطلب:',
    'success.subtitle': 'شكراً لثقتكِ في ROMA! سيقوم فريق خدمة العملاء بالتواصل معكِ فوراً لتأكيد موعد التوصيل.',
    'success.telegram_alert': 'تم إرسال إشعار فوري وتفاصيل الطلب إلى إدارة المتجر لتجهيزه بأسرع وقت.',
    'success.whatsapp_contact': 'تحدثي مع خدمة العملاء عبر واتساب',
    'success.back_home': 'العودة للمتجر',

    // Policies
    'policy.return_title': 'سياسة الاستبدال والاسترجاع (١٤ يوماً)',
    'policy.return_law': 'متوافقة بالكامل مع قانون حماية المستهلك المصري رقم ١٨١ لسنة ٢٠١٨.',
    'policy.return_cosmetics_rule': 'نظراً للطبيعة الصحية لمستحضرات التجميل والعناية الشخصية، يشترط للاستبدال أو الاسترجاع أن تكون العبوة بحالتها الأصلية ومغلفة بغلاف المصنع الحراري ولم يتم فتحها أو استخدامها حفاظاً على السلامة العامة.',
    'policy.shipping_title': 'سياسة الشحن والتوصيل',
    'policy.shipping_cairo': 'القاهرة الكبرى والجيزة: التوصيل خلال ٢٤ - ٤٨ ساعة عمل.',
    'policy.shipping_delta': 'الإسكندرية ومحافظات الدلتا والقناة: خلال ٤٨ - ٧٢ ساعة عمل.',
    'policy.shipping_upper': 'محافظات الصعيد والوجه القبلي والبحر الأحمر: خلال ٣ - ٥ أيام عمل.',
    'policy.privacy_title': 'سياسة الخصوصية وحماية البيانات',
    'policy.privacy_desc': 'نلتزم التزاماً صارماً بعدم مشاركة أو بيع أي من بياناتكِ الشخصية، أرقام الهواتف، أو العناوين لأي أطراف ثالثة. جميع بياناتكِ مشفرة وتستخدم حصراً لتوصيل طلبكِ وتحسين تجربتكِ.',
    'policy.terms_title': 'الشروط والأحكام',

    // Auth & Security
    'auth.login_title': 'تسجيل الدخول في ROMA',
    'auth.register_title': 'إنشاء حساب جديد',
    'auth.password_strength': 'قوة كلمة المرور:',
    'auth.password_rules': 'يجب أن تحتوي على ٨ أحرف على الأقل، حروف كبيرة وصغيرة، وأرقام ورموز',
    'auth.turnstile_protected': 'متحقق منه بواسطة Cloudflare Anti-Bot',
  },
  en: {
    // Brand & General
    'brand.name': 'ROMA Cosmetics',
    'brand.tagline': 'Bespoke Luxury Cosmetics & Fine Accessories for the Modern Woman',
    'brand.currency': 'EGP',
    'common.free_shipping_notice': 'Free Express Delivery across Egypt on orders above 500 EGP ✨',
    'common.free_shipping_progress': 'Add {remaining} EGP more to enjoy Free Express Delivery!',
    'common.free_shipping_qualified': 'Congratulations! Your order qualifies for Free Express Delivery 🚚✨',

    // Navigation
    'nav.home': 'Home',
    'nav.shop': 'Shop All',
    'nav.categories': 'Luxury Collections',
    'nav.face': 'Face & Makeup',
    'nav.serums': 'Serums & Radiance',
    'nav.skincare': 'Skincare Rituals',
    'nav.moisturizers': 'Moisturizers & Silk',
    'nav.lips': 'Velvet Lips',
    'nav.accessories': 'Accessories',
    'nav.policies': 'Store Policies',
    'nav.search_placeholder': 'Search serums, velvet lipsticks, moisturizers, or accessories...',
    'nav.wishlist': 'Wishlist',
    'nav.cart': 'Bag',
    'nav.login': 'Sign In',
    'nav.account': 'My Account',

    // Hero Section
    'hero.badge': '✨ Exclusive Fall/Winter 2026 Collection',
    'hero.title_part1': 'Velvety Luxury Begins at',
    'hero.title_highlight': 'ROMA',
    'hero.description': 'Handcrafted cosmetic formulas and refined accessories formulated exclusively for women in Egypt. Pure organic extracts, cruelty-free, and registered with the Egyptian Ministry of Health.',
    'hero.cta_shop': 'Explore Collection',
    'hero.cta_story': 'Our Botanical Heritage',
    'hero.stat_natural': '100% Pure & Organic',
    'hero.stat_delivery': '24-48h Express Shipping',
    'hero.stat_customers': '+15,000 Happy Clients',

    // Trust & Value Props
    'trust.organic_title': 'Certified Botanical Extracts',
    'trust.organic_desc': '100% pure formulations free from parabens, harsh sulfates, and artificial fragrances',
    'trust.fast_shipping_title': 'Doorstep Express Shipping',
    'trust.fast_shipping_desc': 'Instant delivery to Cairo, Giza, Alexandria, and all Egyptian governorates',
    'trust.cod_title': 'Cash on Delivery & Inspection',
    'trust.cod_desc': 'Complete peace of mind with full package inspection upon arrival',
    'trust.moh_title': 'MOH Egypt Certified',
    'trust.moh_desc': 'Fully licensed, lab-tested, and compliant with Egyptian health standards',

    // Categories Section
    'section.categories_title': 'Explore Royal Collections',
    'section.categories_subtitle': 'Artisan formulations crafted to celebrate your authentic elegance',
    'section.bestsellers_title': 'Most Coveted Bestsellers',
    'section.bestsellers_subtitle': 'Iconic products loved and trusted by thousands of women across Egypt',

    // Product Card & Actions
    'product.add_to_cart': 'Add to Bag',
    'product.buy_now': 'Instant COD Purchase',
    'product.quick_view': 'Quick View',
    'product.in_stock': 'In Stock',
    'product.low_stock': 'Only {count} left in stock!',
    'product.out_of_stock': 'Out of Stock',
    'product.discount_tag': '{percent}% OFF',
    'product.rating': '{rating} ({count} reviews)',
    'product.shade': 'Shade:',
    'product.size': 'Size:',

    // Product Details Page
    'pdp.free_shipping_hint': 'Free Express Delivery on orders over 500 EGP',
    'pdp.fast_delivery_estimate': 'Estimated Delivery: Within 24 - 48h (Cairo & Giza)',
    'pdp.cod_available': 'Cash on Delivery & InstaPay available at your doorstep',
    'pdp.easy_returns': '14-Day Returns & Exchanges compliant with Egyptian Consumer Law',
    'pdp.tab_description': 'Description & Benefits',
    'pdp.tab_ingredients': 'Active Ingredients',
    'pdp.tab_how_to_use': 'Ritual & How to Use',
    'pdp.tab_reviews': 'Customer Reviews & Photos',
    'pdp.select_shade': 'Select your preferred shade:',
    'pdp.sticky_buy': 'Instant Order (Pay upon Delivery)',
    'pdp.sticky_cart': 'Add to Bag',
    'pdp.safety_guarantee': 'Dermatologically Tested: Clinically approved for sensitive skin, hypoallergenic, and non-comedogenic.',

    // Cart Drawer & Page
    'cart.title': 'Your Shopping Bag',
    'cart.empty_title': 'Your Bag is Currently Empty',
    'cart.empty_subtitle': 'Explore our luxurious skincare and cosmetics to find your new favorites',
    'cart.start_shopping': 'Discover Products',
    'cart.summary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.shipping_free': 'Free ✨',
    'cart.shipping_calc': '35 EGP (Express)',
    'cart.total': 'Total',
    'cart.checkout_cta': 'Proceed to Secure Checkout 🛍️',
    'cart.coupon_label': 'Promo Code / Voucher',
    'cart.coupon_placeholder': 'Enter discount code (e.g. ROMA10)',
    'cart.coupon_apply': 'Apply Code',
    'cart.coupon_applied': 'Promo code applied successfully!',

    // Single-Page Checkout
    'checkout.title': 'Express Checkout & Delivery',
    'checkout.subtitle': 'Enter your delivery details below to prepare your handcrafted order for immediate dispatch',
    'checkout.step_shipping': '1. Delivery Details',
    'checkout.full_name': 'Full Name',
    'checkout.phone': 'Mobile Number (WhatsApp enabled)',
    'checkout.email': 'Email Address (for order tracking)',
    'checkout.governorate': 'Governorate',
    'checkout.address': 'Detailed Address (Street, Building, Apt #)',
    'checkout.notes': 'Delivery Notes / Landmark (Optional)',
    'checkout.step_payment': '2. Payment Method',
    'checkout.payment_cod': 'Cash on Delivery (COD)',
    'checkout.payment_cod_desc': 'Pay in cash or via InstaPay upon delivery and parcel inspection',
    'checkout.payment_wallet': 'Mobile Wallets / InstaPay',
    'checkout.payment_wallet_desc': 'Vodafone Cash, Orange Cash, Etisalat Cash, or instant InstaPay transfer',
    'checkout.payment_card': 'Debit / Credit Card (Visa, Mastercard, Meeza)',
    'checkout.payment_card_desc': '256-bit bank encrypted secure online payment',
    'checkout.confirm_order': 'Confirm Order Now (Cash on Delivery)',
    'checkout.submitting': 'Securing your order & dispatching alert...',
    'checkout.security_badge': '🔒 100% Encrypted & Secure Checkout adhering to PCI-DSS standards',
    'checkout.turnstile_badge': '🛡️ Protected by Cloudflare Turnstile anti-bot verification',

    // Order Success
    'success.title': 'Order Placed Successfully! 🎉',
    'success.order_number': 'Order Reference:',
    'success.subtitle': 'Thank you for choosing ROMA! Our client concierges are preparing your package for immediate courier dispatch.',
    'success.telegram_alert': 'A verified notification has been dispatched to store administrators.',
    'success.whatsapp_contact': 'Chat with Customer Concierge on WhatsApp',
    'success.back_home': 'Continue Shopping',

    // Policies
    'policy.return_title': '14-Day Return & Exchange Policy',
    'policy.return_law': 'Strictly compliant with Egyptian Consumer Protection Law No. 181 of 2018.',
    'policy.return_cosmetics_rule': 'Due to sanitary and hygienic standards for cosmetic and skincare items, products must be completely unopened, with original heat-sealed factory shrink wrapping intact to qualify for return or exchange.',
    'policy.shipping_title': 'Shipping & Delivery Timelines',
    'policy.shipping_cairo': 'Greater Cairo & Giza: Delivery within 24 - 48 business hours.',
    'policy.shipping_delta': 'Alexandria, Delta & Canal Governorates: Delivery within 48 - 72 business hours.',
    'policy.shipping_upper': 'Upper Egypt, Red Sea & Sinai: Delivery within 3 - 5 business days.',
    'policy.privacy_title': 'Privacy Policy & Data Security',
    'policy.privacy_desc': 'We uphold a zero-compromise policy regarding client privacy. We never sell, lease, or share personal phone numbers or shipping addresses with any third parties. All client interactions are encrypted.',
    'policy.terms_title': 'Terms of Service',

    // Auth & Security
    'auth.login_title': 'Sign In to ROMA',
    'auth.register_title': 'Create an Account',
    'auth.password_strength': 'Password Strength:',
    'auth.password_rules': 'Must contain at least 8 characters, uppercase, lowercase, numbers, and symbols',
    'auth.turnstile_protected': 'Verified by Cloudflare Anti-Bot',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('roma_language');
      if (saved === 'ar' || saved === 'en') return saved;
    } catch (_) {}
    return 'ar'; // Default Arabic as requested
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('roma_language', newLang);
    } catch (_) {}
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const isAr = lang === 'ar';
  const isEn = lang === 'en';
  const dir: 'rtl' | 'ltr' = isAr ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    if (isAr) {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
    }
  }, [lang, dir, isAr]);

  const t = (key: string, defaultText?: string): string => {
    const table = translations[lang] || translations.ar;
    return table[key] || defaultText || key;
  };

  const formatPrice = (amount: number): string => {
    const num = Math.round(amount);
    return isAr ? `${num} ج.م` : `${num} EGP`;
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        dir,
        isAr,
        isEn,
        formatPrice,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
