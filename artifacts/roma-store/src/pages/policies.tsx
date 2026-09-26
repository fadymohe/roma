import React, { useState } from 'react';
import { useLanguage } from '../lib/language-context';
import { ShieldCheck, Truck, RefreshCw, FileText, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PoliciesPage() {
  const { t, isAr } = useLanguage();
  const [activeTab, setActiveTab] = useState<'returns' | 'shipping' | 'privacy' | 'terms'>('returns');

  return (
    <div className="roma-container py-12 md:py-16">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-accent/15 text-primary border border-accent/20 mb-3">
          <ShieldCheck className="size-3.5" />
          {isAr ? 'الشفافية والأمان القانوني' : 'Legal Transparency & Trust'}
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
          {isAr ? 'سياسات متجر روما الرسمية' : 'ROMA Official Store Policies'}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {isAr
            ? 'نلتزم بأعلى معايير الجودة والشفافية التامة لضمان تجربة تسوق راقية وآمنة متوافقة بالكامل مع القوانين المصرية.'
            : 'We uphold uncompromising standards of transparency and client care, strictly adhering to Egyptian consumer regulations.'}
        </p>
      </div>

      {/* Policy Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10">
        <button
          type="button"
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'returns'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <RefreshCw className="size-4" />
          {isAr ? 'الاستبدال والاسترجاع' : 'Returns & Exchanges'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'shipping'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <Truck className="size-4" />
          {isAr ? 'الشحن والتوصيل' : 'Shipping & Delivery'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'privacy'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <Lock className="size-4" />
          {isAr ? 'الخصوصية والأمان' : 'Privacy & Data Protection'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'terms'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <FileText className="size-4" />
          {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
        </button>
      </div>

      {/* Policy Content Card */}
      <div className="max-w-4xl mx-auto rounded-[32px] border border-border bg-white p-6 md:p-12 shadow-xs">
        {activeTab === 'returns' && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8EBEA] border border-accent/20">
              <AlertCircle className="size-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold text-sm md:text-base text-primary mb-1">
                  {isAr ? 'قانون حماية المستهلك المصري رقم ١٨١ لسنة ٢٠١٨' : 'Compliant with Egyptian Consumer Protection Law 181/2018'}
                </h3>
                <p className="text-xs md:text-sm text-foreground/85 leading-relaxed">
                  {isAr
                    ? 'يحق للعميل استبدال أو استرجاع المنتج خلال ١٤ يوماً من تاريخ الاستلام وفقاً لأحكام القانون، مع مراعاة الطبيعة الصحية والوقائية الخاصة بمستحضرات التجميل.'
                    : 'Customers are entitled to exchange or return merchandise within 14 days of receipt in accordance with statutory consumer rights, subject to strict cosmetic sanitary regulations.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                {isAr ? 'شروط قبول الاستبدال والاسترجاع' : 'Conditions for Return & Exchange'}
              </h2>
              <ul className="space-y-3 text-xs md:text-sm text-foreground/85">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-[#D48B88] shrink-0 mt-0.5" />
                  <span>
                    <strong>{isAr ? 'التغليف الحراري الأصلي: ' : 'Original Factory Shrink Wrap: '}</strong>
                    {isAr
                      ? 'نظراً للطبيعة الحساسة والصحية لمستحضرات التجميل والعناية بالبشرة، يُشترط أن تكون العبوة بحالتها الأصلية غير المفتوحة ومغلفة بالسلوفان الحراري للشركة المصنعة.'
                      : 'Due to strict hygiene standards for personal care items, cosmetic containers must remain unopened with their tamper-evident factory seals intact.'}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-[#D48B88] shrink-0 mt-0.5" />
                  <span>
                    <strong>{isAr ? 'عيوب الصناعة أو التلف أثناء الشحن: ' : 'Manufacturing Flaws or Courier Transit Damage: '}</strong>
                    {isAr
                      ? 'في حال وصول منتج به كسر أو عيب مصنعي، يتم استبداله فوراً مجاناً دون أي مصاريف شحن إضافية بمجرد إخطار خدمة العملاء خلال ٤٨ ساعة من الاستلام.'
                      : 'If an item arrives damaged or defective, it is replaced immediately free of charge with all shipping covered by ROMA upon notifying client support within 48 hours.'}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-[#D48B88] shrink-0 mt-0.5" />
                  <span>
                    <strong>{isAr ? 'استرداد الأموال: ' : 'Refund Processing: '}</strong>
                    {isAr
                      ? 'يتم رد المبالغ المدفوعة عبر نفس طريقة الدفع الأصلية، أو عبر تحويل إنستاباي / فودافون كاش خلال ٣ - ٥ أيام عمل من فحص المنتج المرتجع.'
                      : 'Refunds are disbursed via the original payment method, InstaPay, or mobile wallet within 3 to 5 business days post warehouse quality inspection.'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-foreground">
              {isAr ? 'مواعيد وتغطية الشحن السريع في مصر' : 'Express Delivery Timelines Across Egypt'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-border bg-[#FDFBF7] space-y-2">
                <span className="text-xs font-bold text-primary block">
                  {isAr ? 'القاهرة الكبرى والجيزة' : 'Cairo & Giza'}
                </span>
                <strong className="text-base font-extrabold text-foreground block">
                  {isAr ? '٢٤ - ٤٨ ساعة عمل' : '24 - 48 Hours'}
                </strong>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'شحن سريع لباب المنزل مع إمكانية المعاينة قبل الاستلام' : 'Next-day courier with parcel inspection prior to payment'}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-[#FDFBF7] space-y-2">
                <span className="text-xs font-bold text-primary block">
                  {isAr ? 'الإسكندرية ومحافظات الدلتا' : 'Alexandria & Delta'}
                </span>
                <strong className="text-base font-extrabold text-foreground block">
                  {isAr ? '٤٨ - ٧٢ ساعة عمل' : '48 - 72 Hours'}
                </strong>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'طنطا، المنصورة، الزقازيق، بورسعيد، السويس، الإسماعيلية' : 'Full express coverage to all primary Delta and Canal governorates'}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-[#FDFBF7] space-y-2">
                <span className="text-xs font-bold text-primary block">
                  {isAr ? 'الصعيد والبحر الأحمر وسيناء' : 'Upper Egypt & Coastal'}
                </span>
                <strong className="text-base font-extrabold text-foreground block">
                  {isAr ? '٣ - ٥ أيام عمل' : '3 - 5 Business Days'}
                </strong>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'أسيوط، سوهاج، قنا، الأقصر، أسوان، الغردقة، شرم الشيخ' : 'Reliable delivery to all southern and frontier cities'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8EBEA] border border-accent/20 text-xs md:text-sm text-foreground/85">
              <strong>{isAr ? '✨ ميزة الشحن المجاني: ' : '✨ Free Delivery Tier: '}</strong>
              {isAr
                ? 'جميع الطلبات التي تتجاوز قيمتها ٥٠٠ ج.م مؤهلة تلقائياً للشحن المجاني السريع لجميع أنحاء جمهورية مصر العربية.'
                : 'All orders over 500 EGP automatically qualify for complimentary express shipping across Egypt.'}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-foreground">
              {isAr ? 'حماية البيانات وخصوصية العميلات' : 'Privacy Architecture & Data Protection'}
            </h2>
            <p className="text-xs md:text-sm text-foreground/85 leading-relaxed">
              {isAr
                ? 'في ROMA، نعتبر خصوصيتكِ أمانة مقدسة. نطبق أحدث تقنيات التشفير المتقدمة (256-bit SSL) لحماية جميع معاملاتكِ وبياناتكِ الشخصية.'
                : 'At ROMA, your privacy is paramount. We implement state-of-the-art 256-bit SSL encryption to secure every interaction and transaction.'}
            </p>
            <div className="space-y-3 text-xs md:text-sm text-foreground/85">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-[#D48B88] shrink-0 mt-0.5" />
                <span>
                  <strong>{isAr ? 'عدم مشاركة البيانات: ' : 'Zero Data Selling: '}</strong>
                  {isAr
                    ? 'لا نقوم على الإطلاق ببيع أو مشاركة أو تأجير أرقام الهواتف أو العناوين لأي جهات إعلانية أو وسطاء خارجيين.'
                    : 'We never sell, rent, or trade customer contact details with external advertising brokers.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-[#D48B88] shrink-0 mt-0.5" />
                <span>
                  <strong>{isAr ? 'المدفوعات المشفرة: ' : 'PCI-DSS Compliant Payments: '}</strong>
                  {isAr
                    ? 'بيانات البطاقات البنكية لا تُحفظ على خوادمنا نهائياً، بل تتم معالجتها عبر بوابات دفع مصرفية مرخصة ومعتمدة من البنك المركزي المصري.'
                    : 'Card credentials are never retained on our servers and are tokenized directly through Central Bank of Egypt authorized gateways.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-foreground">
              {isAr ? 'الشروط والأحكام العامة للتعاقد' : 'General Terms of Sale'}
            </h2>
            <p className="text-xs md:text-sm text-foreground/85 leading-relaxed">
              {isAr
                ? 'يخضع استخدام متجر ROMA الإلكتروني وإتمام عمليات الشراء للقوانين السارية بجمهورية مصر العربية. بمجرد تأكيد طلبكِ، يتم حجز المنتجات وإصدار بوليصة شحن فورية موثقة برقم مرجعي فريد.'
                : 'Use of the ROMA digital storefront and placed orders are governed by the laws of the Arab Republic of Egypt. Order confirmation triggers instant inventory allocation and tracked consignment issuance.'}
            </p>
            <div className="p-4 rounded-2xl bg-[#F8EBEA] border border-accent/20 text-xs md:text-sm text-foreground/85">
              {isAr
                ? 'لأي استفسار بخصوص السياسات أو الشحنات، يمكنكِ التواصل مباشرة مع خدمة عملاء ROMA عبر واتساب الرسمي على مدار الساعة.'
                : 'For any policy or delivery inquiries, our client concierge is at your service 24/7 via official WhatsApp support.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
