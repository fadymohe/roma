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
    "id": 1790729932193,
    "nameAr": "كريم الاستحمام المرطب سمر تويست 250 مل من مجموعة العناية بالبشرة سينسيز من ايفا.",
    "slug": "prod-1790729932193",
    "descriptionAr": "بعد يوم طويل ومرهق، دللي بشرتك باستخدام كريم الاستحمام ايفا للعناية بالبشرة الذي يوفر تجربة فاخرة، والتي ستترك بشرتك نظيفة وحريرية للغاية. تشكل تركيبته الغنية مع بروتينات الحليب رغوة غنية تنظف بشرتك بلطف وتغذيها بعمق وتنعيمها بفعالية مع عطر مثير يدوم طويلاً. سيعيد كريم الاستحمام المرطب نضارة البشرة وإشراقها ويوفر لك تجربة ممتعة للاستمتاع ببشرة حريرية رطبة وجميلة للغاية. تعليمات الاستخدام: ضع كمية صغيرة على إسفنجة مبللة. اصنعي رغوة وضعيها على جسمك، ثم اشطفها بالماء الدافئ. الاحتياطات: للاستخدام الخارجي فقط. تجنبي ملامسته للعينين. إذا دخل المنتج في عينيك، اشطفيه جيدًا بالماء. يُحفظ بعيدًا عن متناول الأطفال.\n\n✨ *أبرز المميزات:*\n• يتميز بتركيبة غنية ببروتينات اللبن تشكل رغوة غنية تنظف الجسم بلطف.\n• يترك بشرتك نظيفة وحريرية للغاية.\n• يتميز بعطر مثير يدوم طويلًا.",
    "price": 85,
    "compareAtPrice": 106,
    "category": "مرطبات (Moisturizers)",
    "imageUrl": "/uploads/prod_amz_1790729930813_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790729930813_2.jpg",
      "/uploads/prod_amz_1790729930813_3.jpg",
      "/uploads/prod_amz_1790729930813_4.jpg",
      "/uploads/prod_amz_1790729930813_5.jpg"
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
        "sku": "RM-1790729932193",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790697914024,
    "nameAr": "إسورة للنساء، مصنوعة من النحاس المطلي بالذهب عيار 14 قيراط، بلون ذهبي وتصميم تشين لينك، مقاس 21.59 سم",
    "slug": "prod-1790697914024",
    "descriptionAr": "خلخال مطلي بالذهب عيار 14 قيراط للنساء وطول كل خلخال: 8.5 انش + 2 انش موسع.\n\n✨ *أبرز المميزات:*\n• مجموعة أساور أنيقة مطلية بالذهب عيار 14 قيراط: تتضمن المجموعة أساور فيجارو وأساور بحلقات كوبية وأساور متعرجة وأساور مشبك ورق وأساور حبل. مناسبة للطبقات أو العرض الفردي.\n• مقاس السوار القابل للتعديل: يبلغ طول كل سوار 6.5 بوصة مع وصلة تمديد 2.5 بوصة. تصميم مشبك سرطان البحر القوي يسمح بسهولة تخصيص الطول، وهو مثالي للنساء والمراهقين.\n• مواد عالية الجودة: أساور مطلية بالذهب عيار 14 قيراط، خالية من الرصاص والنيكل ولا تسبب الحساسية. مثالي للبشرة الحساسة والاستخدام طوال اليوم.\n• تغليف والمناسبات الرائعة: تأتي هذه الأساور الأنيقة المطلية بالذهب عيار 14 قيراط في صندوق هدايا لطيف، مما يجعلها خيارًا رائعًا كهدية. مناسبة لجميع المناسبات.\n• خدمة استثنائية: تقدم ديارمي خدمة فائقة لضمان حصولك على تجربة تسوق ممتعة. إذا كان لديك أي أسئلة، يرجى عدم التردد في الاتصال بنا.",
    "price": 323,
    "compareAtPrice": 404,
    "category": "إكسسوارات ومجوهرات (Accessories)",
    "imageUrl": "/uploads/prod_amz_1790697913589_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790697913589_2.jpg",
      "/uploads/prod_amz_1790697913589_3.jpg",
      "/uploads/prod_amz_1790697913589_4.jpg",
      "/uploads/prod_amz_1790697913589_5.jpg"
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
        "sku": "RM-1790697914024",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790697695231,
    "nameAr": "مشابك شعر بلاستيكية من زوزي (مشبكان على بطاقة) للنساء والبنات، مشابك قوية مانعة للانزلاق تناسب الشعر الكثيف والخفيف لتصفيف الشعر اليومي",
    "slug": "prod-1790697695231",
    "descriptionAr": "صففي شعرك دون عناء مع مجموعة مشابك الشعر البلاستيكية من زوزي. تتضمن هذه المجموعة مشبكي شعر متينين مرتبطين ببطاقة عرض مريحة، مما يجعلها سهلة التخزين والحمل. مصممة بقبضة قوية، تساعد هذه المشابك على الحفاظ على الشعر في مكانه بشكل آمن طوال اليوم. مناسب للشعر السميك أو الرقيق أو المجعد أو المفرود، يوفر الهيكل البلاستيكي خفيف الوزن ارتداءً مريحًا دون شد الشعر أو إتلافه. مثالية لابتكار تسريحات شعر سريعة مثل الكعك وتصفيفات نصف المتابعة والمظهر اليومي الكاجوال. مثالية للنساء والفتيات، إكسسوارات الشعر العملية هذه مناسبة للمنزل والعمل والمدرسة والسفر والمناسبات الخاصة.\n\n✨ *أبرز المميزات:*\n• تتضمن قطعتين من مشابك الشعر بتصميم مخلب من البلاستيك مرفقتين ببطاقة عرض\n• القبضة القوية المانعة للانزلاق تساعد في تثبيت الشعر بشكل مريح\n• مناسبة لأنواع الشعر الكثيف والخفيف والمجعد والمستقسم.\n• تصميم خفيف الوزن لراحة تدوم طوال اليوم.\n• مثالية لتسريحات الكعكة وتسريحات نصف الرفعة والتصفيف اليومي.",
    "price": 19,
    "compareAtPrice": 24,
    "category": "العناية بالشعر (Hair Care)",
    "imageUrl": "/uploads/prod_amz_1790697693001_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790697693001_2.jpg",
      "/uploads/prod_amz_1790697693001_3.jpg",
      "/uploads/prod_amz_1790697693001_4.jpg",
      "/uploads/prod_amz_1790697693001_5.jpg"
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
        "sku": "RM-1790697695231",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790678966862,
    "nameAr": "لوشن مزيج مهدئ للبشرة الحساسة من ايفا كزوميتيكس اوبتيموم كير ريسيبي - برائحة الفانيليا 370 مل",
    "slug": "prod-1790678966862",
    "descriptionAr": "تُضفي وصفة ايفا اوبتيموم كير بشرتك على مغذيات موضعية صحية جديدة مع تجربة معطرة مبهجة. تم تركيب هذا المزيج المهدئ بعناية لتهدئة الإحساس بحكة البشرة وتوفير النعومة، وبالتالي توفير الراحة للبشرة الحساسة وتركها معطرة برائحة الفانيليا الغنية بخلاصة اللوفيرا والخيار والفانيلين وزبدة الشيا. خالية من البارابين والفثالات والملونات\n\n✨ *أبرز المميزات:*\n• فانيليا وزبدة الشيا.\n• لوشن للجسم",
    "price": 152,
    "compareAtPrice": 190,
    "category": "مرطبات (Moisturizers)",
    "imageUrl": "/uploads/prod_amz_1790678966465_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790678966465_2.jpg",
      "/uploads/prod_amz_1790678966465_3.jpg",
      "/uploads/prod_amz_1790678966465_4.jpg",
      "/uploads/prod_amz_1790678966465_5.jpg"
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
        "sku": "RM-1790678966862",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790678926586,
    "nameAr": "سيروم ديرمايل ادفانسد سكين بوستر بالإبر الدقيقة - سيروم مرطب ومعزز للتوهج لبشرة ناعمة ومشرقة وتنقية المسام ودعم حاجز البشرة",
    "slug": "prod-1790678926586",
    "descriptionAr": "سيروم ديرمايل سكين بوستر مايكرو نيدلينج هو مصل وجه متطور غني بالمكونات النشطة الطبيعية وتقنية الإسفنج المائي الفريدة المصممة لتنشيط البشرة الباهتة والمتعبة مع تعزيز التوهج والإشراق. يقوي حاجز البشرة، ويقلل من ظهور التجاعيد والخطوط الدقيقة، ويرطب بعمق ويستعيد الانتعاش والإشراقة الشبابية. توفر الإسفنجة المتحللة مع الإبر الدقيقة الشبيهة بالإبر الدقيقة مكونات نشطة، وتحسن ملمس البشرة ومرونتها عن طريق تحفيز الكولاجين وتحارب الشيخوخة من خلال الببتيدات ومضادات الأكسدة. هذا المنتج مخصص لاستخدامات الوجه ويأتي بكمية 30 مل.\n\n✨ *أبرز المميزات:*\n• تركيبة منعشة: تساعد على إنعاش البشرة الباهتة والمتعبة للحصول على مظهر منشط مع لمعان معزز\n• تعزيز التوهج: يعزز التوهج الطبيعي للبشرة وإشراقها للحصول على بشرة أكثر إشراقًا\n• دعم حاجز الجلد: يقوي حاجز البشرة مع تحسين مظهر الملمس والمرونة\n• فوائد مضادة للشيخوخة: تساعد على تقليل ظهور التجاعيد والخطوط الدقيقة للحصول على بشرة أكثر نعومة\n• نظام توصيل متقدم: يوفر مكونات نشطة مع الببتيدات ومضادات الأكسدة باستخدام تقنية الإسفنج المتحلل\n• ترطيب عميق: يوفر رطوبة مكثفة للمساعدة في استعادة نضارة البشرة والحفاظ على مظهر شبابي",
    "price": 372,
    "compareAtPrice": 465,
    "category": "سيروم وزيوت (Serums & Oils)",
    "imageUrl": "/uploads/prod_amz_1790678926013_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790678926013_2.jpg",
      "/uploads/prod_amz_1790678926013_3.jpg",
      "/uploads/prod_amz_1790678926013_4.jpg",
      "/uploads/prod_amz_1790678926013_5.jpg"
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
        "sku": "RM-1790678926586",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790678909612,
    "nameAr": "مرطب جل كريم سيبيو كونترول من نوفيراكوزميتيكس، موازنة الزيت، يتكون من خليط الزنك بي سي ايه ومركب سيراميد للتحكم في اللمعان، 50 مل",
    "slug": "prod-1790678909612",
    "descriptionAr": "نقدم لكِ مرطب جل كريم سيبيو كونترول من نوفيراكوزميتكس، وهو حل خفيف الوزن ويدوم طويلًا تم تركيبه خصيصًا لأنواع البشرة الدهنية والمختلطة. يتميز هذا المرطب الموازن للزيت بسعة 50 مل بتركيبة الترطيب العميق مويست24 القوية، إذ يجمع بين الزنك بي سي ايه ومركب سيراميد لتوفير ما يصل إلى 24 ساعة من الرطوبة المستمرة للتحكم في اللمعان الزائد. تمتص البشرة قوام الجل الكريمي دون عناء ودون ترك أي بقايا دهنية، مما يجعله مرطبًا يوميًا مثاليًا لأولئك الذين يعانون من اللمعان غير المرغوب فيه والمسام الواسعة. يعمل الزنك بي سي ايه على تنظيم إنتاج الدهون، بينما يساعد مركب سيراميد في تقوية الحاجز الطبيعي للبشرة، مما يترك بشرتكِ تبدو متجددة، ومتوازنة، وصحية. سواء تم استخدامه بمفرده أو كقاعدة تحت المكياج، فإن هذا المرطب يوفر لمسة نهائية ناعمة، ومطفية تدوم طوال اليوم. أضيفي مرطب الجل الكريمي سيبيو كونترول إلى روتينكِ اليومي للعناية بالبشرة واستمتعي بالمسام المحسنة بشكل واضح، وحاجز أقوى للبشرة، وبشرة متوازنة بشكل جميل.\n\n✨ *أبرز المميزات:*\n• تركيبة موازنة الزيت: تم تصميم مرطب الجل الكريمي هذا خصيصًا لتنظيم الإفرازات الدهنية، لتجنب اللمعان طوال اليوم\n• المكونات النشطة الرئيسية: تم تركيبه من الزنك بي سي ايه ومركب سيراميد لتحسين المسام، والتحكم في الزيوت الزائدة، وتقوية حاجز الرطوبة الطبيعي للبشرة\n• ترطيب لمدة 24 ساعة: مدعوم بتقنية الترطيب العميق مويست24، يوفر هذا المرطب رطوبة تدوم طويلًا مدة تصل إلى 24 ساعة\n• قوام خفيف: يُمتص قوام الجل الكريمي بسرعة في البشرة دون الشعور بثقل أو ملمس دهني، مما يجعله مثاليًا لأنواع البشرة الدهنية والمختلطة\n• مقاس كبير: تحتوي كل زجاجة بمضخة على 50 مل من المنتج، مما يوفر إمدادًا وافرًا للاستخدام اليومي المتسق كجزء من روتين العناية بالبشرة",
    "price": 292,
    "compareAtPrice": 365,
    "category": "سيروم وزيوت (Serums & Oils)",
    "imageUrl": "/uploads/prod_amz_1790678908731_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790678908731_2.jpg",
      "/uploads/prod_amz_1790678908731_3.jpg",
      "/uploads/prod_amz_1790678908731_4.jpg",
      "/uploads/prod_amz_1790678908731_5.jpg"
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
        "sku": "RM-1790678909612",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790678853571,
    "nameAr": "اسفنجة بودرة ناعمة مثلثة الشكل قابلة لاعادة الاستخدام لوضع البودرة السائبة والجسم والعيون وكريم الاساس والمكياج الرطب والجاف، قطعتين، متعدد الألوان",
    "slug": "prod-1790678853571",
    "descriptionAr": "اسفنجة بودرة ناعمة مثلثة الشكل قابلة لاعادة الاستخدام لوضع البودرة السائبة والعيون وكريم الاساس والرطب والجاف، قطعتان بلون اسود\n\n✨ *أبرز المميزات:*\n• نوع الجلد: زيتي\n• شكل المنتج: مثلث\n• استخدامات محددة للمنتج: مزج",
    "price": 23,
    "compareAtPrice": 29,
    "category": "المكياج والجمال (Makeup)",
    "imageUrl": "/uploads/prod_amz_1790678852399_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790678852399_2.jpg",
      "/uploads/prod_amz_1790678852399_3.jpg",
      "/uploads/prod_amz_1790678852399_4.jpg",
      "/uploads/prod_amz_1790678852399_5.jpg"
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
        "sku": "RM-1790678853571",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790678819577,
    "nameAr": "كريم العيون برايت اند جلو من يوليشوس - 15 مل",
    "slug": "prod-1790678819577",
    "descriptionAr": "كريم العيون برايت اند جلو من يوليشوس بتركيبة متطورة مصنوعة من أجود المكونات لتوفير مظهر مشرق وناعم وصحي. • الفرق الملحوظ المتوقع في غضون 6 أسابيع من الاستخدام المستمر. • مصمم خصيصًا لتفتيح وترطيب المنطقة المحيطة بالعينين وتقليل الانتفاخ والهالات السوداء والخطوط الدقيقة والتجاعيد لتوفير مظهر صحي لمحيط العين\" بلطف على منطقة محيط العين بواسطة كرة دوارة ثم دلكي بلطف حتى يتم امتصاصه بالكامل، مرتين يوميًا\n\n✨ *أبرز المميزات:*\n• يقلل من الهالات السوداء والانتفاخات - مدعوم بالكافيين ومستخلص الشاي الأخضر",
    "price": 174,
    "compareAtPrice": 218,
    "category": "مرطبات (Moisturizers)",
    "imageUrl": "/uploads/prod_amz_1790678819161_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790678819161_2.jpg",
      "/uploads/prod_amz_1790678819161_3.jpg",
      "/uploads/prod_amz_1790678819161_4.jpg",
      "/uploads/prod_amz_1790678819161_5.jpg"
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
        "sku": "RM-1790678819577",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790678664668,
    "nameAr": "لوشن مزيج مهدئ للبشرة الحساسة من ايفا كزوميتيكس اوبتيموم كير ريسيبي - برائحة الفانيليا 370 مل",
    "slug": "prod-1790678664668",
    "descriptionAr": "تُضفي وصفة ايفا اوبتيموم كير بشرتك على مغذيات موضعية صحية جديدة مع تجربة معطرة مبهجة. تم تركيب هذا المزيج المهدئ بعناية لتهدئة الإحساس بحكة البشرة وتوفير النعومة، وبالتالي توفير الراحة للبشرة الحساسة وتركها معطرة برائحة الفانيليا الغنية بخلاصة اللوفيرا والخيار والفانيلين وزبدة الشيا. خالية من البارابين والفثالات والملونات\n\n✨ *أبرز المميزات:*\n• فانيليا وزبدة الشيا.\n• لوشن للجسم",
    "price": 152,
    "compareAtPrice": 190,
    "category": "مرطبات (Moisturizers)",
    "imageUrl": "/uploads/prod_amz_1790678664030_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790678664030_2.jpg",
      "/uploads/prod_amz_1790678664030_3.jpg",
      "/uploads/prod_amz_1790678664030_4.jpg",
      "/uploads/prod_amz_1790678664030_5.jpg"
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
        "sku": "RM-1790678664668",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790678582694,
    "nameAr": "منظم مكياج دوار 360 درجة قابل للتعديل ومتعدد الوظائف من الاكريليك لتخزين مستحضرات التجميل",
    "slug": "prod-1790678582694",
    "descriptionAr": "منظم مكياج دوار 360 درجة قابل للتعديل ومتعدد الوظائف من الاكريليك لتخزين مستحضرات التجميل\n\n✨ *أبرز المميزات:*\n• تصميم دوار 360 درجة مع تكوين قابل للتعديل لتنظيم مستحضرات التجميل\n• مصنوع من الأكريليك الشفاف بلمسة نهائية مصقولة بقياس 27 سم عرض × 35 سم ارتفاع\n• شكل دائري يوفر تخزين متعدد الوظائف لأدوات المكياج ومستحضرات التجميل\n• يزن 0.75 كيلوجرام للوضع على طاولة الزينة أو المكتب أو طاولة السرير",
    "price": 204,
    "compareAtPrice": 255,
    "category": "المكياج والجمال (Makeup)",
    "imageUrl": "/uploads/prod_amz_1790678581266_1.jpg",
    "additionalImages": [
      "/uploads/prod_amz_1790678581266_2.jpg",
      "/uploads/prod_amz_1790678581266_3.jpg",
      "/uploads/prod_amz_1790678581266_4.jpg",
      "/uploads/prod_amz_1790678581266_5.jpg"
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
        "sku": "RM-1790678582694",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790675834645,
    "nameAr": "مجموعة زجاجات سفر من 11 قطعة لمستحضرات التجميل، مانعة للتسرب وقابلة لإعادة الملء، حاويات فارغة مع شنطة والشامبو والبلسم واللوشن، 12 - نمط نورديك، للسفر",
    "slug": "prod-1790675834645",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 125,
    "compareAtPrice": 156,
    "category": "المكياج والجمال (Makeup)",
    "imageUrl": "/uploads/prod_1790675828701.jpg",
    "additionalImages": [
      "/uploads/prod_1790675829212.jpg",
      "/uploads/prod_1790675829724.jpg",
      "/uploads/prod_1790675830236.jpg"
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
        "sku": "RM-1790675834645",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790675755388,
    "nameAr": "قناع حليب لتفتيح البشرة ، مع فيتامين اي 250 جرام من بوبانا لنوع كل الأنواعة قد يختلف تصميم العبوة",
    "slug": "prod-1790675755388",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 55,
    "compareAtPrice": 69,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790675753349.jpg",
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
        "sku": "RM-1790675755388",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790675353063,
    "nameAr": "بلسم شفاه سكين كير سينسيز من ايفا، نكهة بطيخ منعشة، عبوة سعة 4 جم",
    "slug": "prod-1790675353063",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 59,
    "compareAtPrice": 74,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790675350911.jpg",
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
        "sku": "RM-1790675353063",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790675255168,
    "nameAr": "سبلاش للجسم سينسيز من ايفا سكين كير - كوزي دريم 240 مل، للأنثى",
    "slug": "prod-1790675255168",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 183,
    "compareAtPrice": 229,
    "category": "المكياج والجمال (Makeup)",
    "imageUrl": "/uploads/prod_1790675252498.jpg",
    "additionalImages": [
      "/uploads/prod_1790675253013.jpg"
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
        "sku": "RM-1790675255168",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790675180203,
    "nameAr": "كريم استحمام سينسيز للعناية بالبشرة من ايفا كوزميتكس، ان ذا كلاودز، 250 مل",
    "slug": "prod-1790675180203",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 90,
    "compareAtPrice": 113,
    "category": "العناية بالشعر (Hair Care)",
    "imageUrl": "/uploads/prod_1790675178071.jpg",
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
        "sku": "RM-1790675180203",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790675033368,
    "nameAr": "قلم تحديد العيون ايسنس يدوم طويلا 01 بلاك فيفر، غير لامع، أسود",
    "slug": "prod-1790675033368",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 195,
    "compareAtPrice": 244,
    "category": "المكياج والجمال (Makeup)",
    "imageUrl": "/uploads/prod_1790675010218.jpg",
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
        "sku": "RM-1790675033368",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790674840849,
    "nameAr": "ايفا لمستحضرات التجميل - مقشر شفاه بنكهة التوت البري - 20 جرام",
    "slug": "prod-1790674840849",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 59,
    "compareAtPrice": 74,
    "category": "المكياج والجمال (Makeup)",
    "imageUrl": "/uploads/prod_1790674838710.jpg",
    "additionalImages": [
      "/uploads/prod_1790674839212.jpg"
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
        "sku": "RM-1790674840849",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790674752479,
    "nameAr": "ماسكارا بلاك من مايبيلين نيويورك للرموش الطويلة للغاية لاش سينسيشنال سكاي هاي لون اسود 7.2 مل",
    "slug": "prod-1790674752479",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 490,
    "compareAtPrice": 613,
    "category": "المكياج والجمال (Makeup)",
    "imageUrl": "/uploads/prod_1790674747566.jpg",
    "additionalImages": [
      "/uploads/prod_1790674748298.jpg",
      "/uploads/prod_1790674749099.jpg",
      "/uploads/prod_1790674749529.jpg"
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
        "sku": "RM-1790674752479",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790674622751,
    "nameAr": "بلندز هيربال سنسيشن كريم بحبة البركة (١٨٠ مل) - ليف إن للشعر الضعيف - حماية وتقوية",
    "slug": "prod-1790674622751",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 32,
    "compareAtPrice": 40,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790674620999.jpg",
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
        "sku": "RM-1790674622751",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790674564792,
    "nameAr": "كريم بانثينول للبشرة من هيبتا، 50 جم",
    "slug": "prod-1790674564792",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 75,
    "compareAtPrice": 94,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790674562425.jpg",
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
        "sku": "RM-1790674564792",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790674525699,
    "nameAr": "سبلاش للجسم من ايفا سكين كير سينسيز - ان ذا كلاودز 240 مل",
    "slug": "prod-1790674525699",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 183,
    "compareAtPrice": 229,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790674522695.jpg",
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
        "sku": "RM-1790674525699",
        "stock": 50
      }
    ]
  },
  {
    "id": 1790674427175,
    "nameAr": "لوشن للجسم كامل من جليسوليد يوفر ترطيباً عميقاً للبشرة الجافة للحفاظ عليها ناعمة ومرطبة، مناسب للبشرة الجافة، 500 مل",
    "slug": "prod-1790674427175",
    "descriptionAr": "مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.",
    "price": 175,
    "compareAtPrice": 219,
    "category": "العناية بالبشرة (Skincare)",
    "imageUrl": "/uploads/prod_1790674425006.jpg",
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
        "sku": "RM-1790674427175",
        "stock": 50
      }
    ]
  },
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
