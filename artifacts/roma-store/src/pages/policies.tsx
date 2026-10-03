import React, { useState } from 'react';
import { useLanguage } from '../lib/language-context';
import { ShieldCheck, Truck, RefreshCw, FileText, Lock, CheckCircle2, AlertCircle, Sparkles, MessageCircle } from 'lucide-react';

export default function PoliciesPage() {
  const { t, isAr } = useLanguage();
  const [activeTab, setActiveTab] = useState<'returns' | 'shipping' | 'privacy' | 'terms'>('returns');

  return (
    <div className="roma-container py-12 md:py-16 text-[#F9FAFB]">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#D4A5A5]/10 text-[#D4A5A5] border border-[#D4A5A5]/25 mb-3 shadow-xs">
          <ShieldCheck className="size-3.5" />
          <span>{isAr ? 'الشفافية والأمان القانوني' : 'Legal Transparency & Trust'}</span>
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
          {isAr ? 'سياسات متجر روما الرسمية' : 'ROMA Official Store Policies'}
        </h1>
        <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-normal">
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-xs active:scale-95 ${
            activeTab === 'returns'
              ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20'
              : 'bg-[#141414] text-zinc-400 hover:text-white border border-white/10 hover:border-[#D4A5A5]/40'
          }`}
        >
          <RefreshCw className="size-4" />
          <span>{isAr ? 'الاستبدال والاسترجاع' : 'Returns & Exchanges'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-xs active:scale-95 ${
            activeTab === 'shipping'
              ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20'
              : 'bg-[#141414] text-zinc-400 hover:text-white border border-white/10 hover:border-[#D4A5A5]/40'
          }`}
        >
          <Truck className="size-4" />
          <span>{isAr ? 'الشحن والتوصيل' : 'Shipping & Delivery'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-xs active:scale-95 ${
            activeTab === 'privacy'
              ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20'
              : 'bg-[#141414] text-zinc-400 hover:text-white border border-white/10 hover:border-[#D4A5A5]/40'
          }`}
        >
          <Lock className="size-4" />
          <span>{isAr ? 'الخصوصية والأمان' : 'Privacy & Data Protection'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-xs active:scale-95 ${
            activeTab === 'terms'
              ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20'
              : 'bg-[#141414] text-zinc-400 hover:text-white border border-white/10 hover:border-[#D4A5A5]/40'
          }`}
        >
          <FileText className="size-4" />
          <span>{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</span>
        </button>
      </div>

      {/* Policy Content Card - Pitch Charcoal & Rose Gold Theme */}
      <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-b from-[#141414] via-[#121212] to-[#0E0E0E] p-6 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4A5A5]/5 rounded-full blur-3xl" />

        {activeTab === 'returns' && (
          <div className="space-y-6 relative z-10">
            {/* Egyptian Law Notification Box */}
            <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-[#D4A5A5]/10 border border-[#D4A5A5]/25">
              <AlertCircle className="size-5 sm:size-6 text-[#D4A5A5] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold text-sm md:text-base text-[#D4A5A5] mb-1">
                  {isAr ? 'قانون حماية المستهلك المصري رقم ١٨١ لسنة ٢٠١٨' : 'Compliant with Egyptian Consumer Protection Law 181/2018'}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                  {isAr
                    ? 'يحق للعميل استبدال أو استرجاع المنتج خلال ١٤ يوماً من تاريخ الاستلام وفقاً لأحكام القانون، مع مراعاة الطبيعة الصحية والوقائية الخاصة بمستحضرات التجميل.'
                    : 'Customers are entitled to exchange or return merchandise within 14 days of receipt in accordance with statutory consumer rights, subject to strict cosmetic sanitary regulations.'}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white border-b border-white/10 pb-3">
                {isAr ? 'شروط قبول الاستبدال والاسترجاع' : 'Conditions for Return & Exchange'}
              </h2>
              <ul className="space-y-4 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-3 bg-[#181818]/60 p-3.5 rounded-2xl border border-white/5">
                  <CheckCircle2 className="size-4 text-[#D4A5A5] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white font-bold">{isAr ? 'التغليف الحراري الأصلي: ' : 'Original Factory Shrink Wrap: '}</strong>
                    {isAr
                      ? 'نظراً للطبيعة الحساسة والصحية لمستحضرات التجميل والعناية بالبشرة، يُشترط أن تكون العبوة بحالتها الأصلية غير المفتوحة ومغلفة بالسلوفان الحراري للشركة المصنعة.'
                      : 'Due to strict hygiene standards for personal care items, cosmetic containers must remain unopened with their tamper-evident factory seals intact.'}
                  </span>
                </li>
                <li className="flex items-start gap-3 bg-[#181818]/60 p-3.5 rounded-2xl border border-white/5">
                  <CheckCircle2 className="size-4 text-[#D4A5A5] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white font-bold">{isAr ? 'عيوب الصناعة أو التلف أثناء الشحن: ' : 'Manufacturing Flaws or Courier Transit Damage: '}</strong>
                    {isAr
                      ? 'في حال وصول منتج به كسر أو عيب مصنعي، يتم استبداله فوراً مجاناً دون أي مصاريف شحن إضافية بمجرد إخطار خدمة العملاء خلال ٤٨ ساعة من الاستلام.'
                      : 'If an item arrives damaged or defective, it is replaced immediately free of charge with all shipping covered by ROMA upon notifying client support within 48 hours.'}
                  </span>
                </li>
                <li className="flex items-start gap-3 bg-[#181818]/60 p-3.5 rounded-2xl border border-white/5">
                  <CheckCircle2 className="size-4 text-[#D4A5A5] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white font-bold">{isAr ? 'استرداد الأموال: ' : 'Refund Processing: '}</strong>
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
          <div className="space-y-6 relative z-10">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white border-b border-white/10 pb-3">
              {isAr ? 'مواعيد وتغطية الشحن السريع في مصر' : 'Express Delivery Timelines Across Egypt'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-white/10 bg-[#181818] space-y-2 hover:border-[#D4A5A5]/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4A5A5] block">
                    {isAr ? 'القاهرة الكبرى والجيزة' : 'Cairo & Giza'}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#D4A5A5]/10 text-[#D4A5A5] border border-[#D4A5A5]/25">
                    {isAr ? '80 ج.م' : '80 EGP'}
                  </span>
                </div>
                <strong className="text-base font-extrabold text-white block font-mono">
                  {isAr ? '٢٤ - ٤٨ ساعة عمل' : '24 - 48 Hours'}
                </strong>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {isAr ? 'شحن فوري لباب المنزل مع إمكانية المعاينة قبل الاستلام' : 'Next-day courier with parcel inspection prior to payment'}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#181818] space-y-2 hover:border-[#D4A5A5]/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4A5A5] block">
                    {isAr ? 'الإسكندرية ومحافظات الدلتا' : 'Alexandria & Delta'}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#D4A5A5]/10 text-[#D4A5A5] border border-[#D4A5A5]/25">
                    {isAr ? '90 ج.م' : '90 EGP'}
                  </span>
                </div>
                <strong className="text-base font-extrabold text-white block font-mono">
                  {isAr ? '٤٨ - ٧٢ ساعة عمل' : '48 - 72 Hours'}
                </strong>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {isAr ? 'طنطا، المنصورة، الزقازيق، كفر الشيخ، بورسعيد، السويس، الإسماعيلية' : 'Full express coverage to all primary Delta and Canal governorates'}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#181818] space-y-2 hover:border-[#D4A5A5]/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4A5A5] block">
                    {isAr ? 'الصعيد والغردقة وسيناء' : 'Upper Egypt & Hurghada'}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#D4A5A5]/10 text-[#D4A5A5] border border-[#D4A5A5]/25">
                    {isAr ? '130 ج.م' : '130 EGP'}
                  </span>
                </div>
                <strong className="text-base font-extrabold text-white block font-mono">
                  {isAr ? '٣ - ٥ أيام عمل' : '3 - 5 Business Days'}
                </strong>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {isAr ? 'أسيوط، سوهاج، قنا، الأقصر، أسوان، الفيوم، بني سويف، المنيا، الغردقة، شرم الشيخ' : 'Reliable delivery to Upper Egypt, Hurghada, and Red Sea'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#D4A5A5]/15 via-[#D4A5A5]/10 to-transparent border border-[#D4A5A5]/30 text-xs md:text-sm text-zinc-200 flex items-center gap-2.5">
              <Sparkles className="size-4 text-[#D4A5A5] shrink-0" />
              <span>
                <strong className="text-white font-bold">{isAr ? 'الحد الأدنى للطلب: ' : 'Minimum Order Policy: '}</strong>
                {isAr
                  ? 'الحد الأدنى للطلب في متجر روما هو ٢٠٠ ج.م لضمان أعلى معايير الجودة والتغليف الملكي والشحن السريع لجميع محافظات مصر.'
                  : 'The minimum order value at ROMA is 200 EGP to ensure the highest standards of royal packaging and express fulfillment across Egypt.'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6 relative z-10">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white border-b border-white/10 pb-3">
              {isAr ? 'حماية البيانات وخصوصية العميلات' : 'Privacy Architecture & Data Protection'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
              {isAr
                ? 'في ROMA، نعتبر خصوصيتكِ أمانة مقدسة. نطبق أحدث تقنيات التشفير المتقدمة (256-bit SSL) لحماية جميع معاملاتكِ وبياناتكِ الشخصية.'
                : 'At ROMA, your privacy is paramount. We implement state-of-the-art 256-bit SSL encryption to secure every interaction and transaction.'}
            </p>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <div className="flex items-start gap-3 bg-[#181818]/60 p-3.5 rounded-2xl border border-white/5">
                <CheckCircle2 className="size-4 text-[#D4A5A5] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-bold">{isAr ? 'عدم مشاركة البيانات: ' : 'Zero Data Selling: '}</strong>
                  {isAr
                    ? 'لا نقوم على الإطلاق ببيع أو مشاركة أو تأجير أرقام الهواتف أو العناوين لأي جهات إعلانية أو وسطاء خارجيين.'
                    : 'We never sell, rent, or trade customer contact details with external advertising brokers.'}
                </span>
              </div>
              <div className="flex items-start gap-3 bg-[#181818]/60 p-3.5 rounded-2xl border border-white/5">
                <CheckCircle2 className="size-4 text-[#D4A5A5] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-bold">{isAr ? 'المدفوعات المشفرة: ' : 'PCI-DSS Compliant Payments: '}</strong>
                  {isAr
                    ? 'بيانات البطاقات البنكية لا تُحفظ على خوادمنا نهائياً، بل تتم معالجتها عبر بوابات دفع مصرفية مرخصة ومعتمدة من البنك المركزي المصري.'
                    : 'Card credentials are never retained on our servers and are tokenized directly through Central Bank of Egypt authorized gateways.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6 relative z-10">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white border-b border-white/10 pb-3">
              {isAr ? 'الشروط والأحكام العامة للتعاقد' : 'General Terms of Sale'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
              {isAr
                ? 'يخضع استخدام متجر ROMA الإلكتروني وإتمام عمليات الشراء للقوانين السارية بجمهورية مصر العربية. بمجرد تأكيد طلبكِ، يتم حجز المنتجات وإصدار بوليصة شحن فورية موثقة برقم مرجعي فريد.'
                : 'Use of the ROMA digital storefront and placed orders are governed by the laws of the Arab Republic of Egypt. Order confirmation triggers instant inventory allocation and tracked consignment issuance.'}
            </p>
            <div className="p-4 rounded-2xl bg-[#181818] border border-white/10 text-xs sm:text-sm text-zinc-300 flex items-center gap-3">
              <MessageCircle className="size-5 text-[#D4A5A5] shrink-0" />
              <span>
                {isAr
                  ? 'لأي استفسار بخصوص السياسات أو الشحنات، يمكنكِ التواصل مباشرة مع خدمة عملاء ROMA عبر واتساب الرسمي على مدار الساعة (01505566849).'
                  : 'For any policy or delivery inquiries, our client concierge is at your service 24/7 via official WhatsApp support (+201505566849).'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
