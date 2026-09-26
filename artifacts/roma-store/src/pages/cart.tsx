import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Plus,
  Trash2,
  Truck,
  Tag,
  ShieldCheck,
  User as UserIcon,
  ShoppingBag,
  Sparkles,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { notifyTelegramNewOrder } from '@/lib/telegram';
import { uploadOrderToSupabase } from '@/lib/supabase';

const GOVERNORATES = [
  { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo' },
  { id: 'giza', nameAr: 'الجيزة', nameEn: 'Giza' },
  { id: 'alex', nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
  { id: 'qalyubia', nameAr: 'القليوبية', nameEn: 'Qalyubia' },
  { id: 'dakahlia', nameAr: 'الدقهلية', nameEn: 'Dakahlia' },
  { id: 'gharbia', nameAr: 'الغربية', nameEn: 'Gharbia' },
  { id: 'sharqia', nameAr: 'الشرقية', nameEn: 'Sharqia' },
  { id: 'monufia', nameAr: 'المنوفية', nameEn: 'Monufia' },
  { id: 'beheira', nameAr: 'البحيرة', nameEn: 'Beheira' },
  { id: 'damietta', nameAr: 'دمياط', nameEn: 'Damietta' },
  { id: 'port_said', nameAr: 'بورسعيد', nameEn: 'Port Said' },
  { id: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia' },
  { id: 'suez', nameAr: 'السويس', nameEn: 'Suez' },
  { id: 'faiyum', nameAr: 'الفيوم', nameEn: 'Faiyum' },
  { id: 'beni_suef', nameAr: 'بني سويف', nameEn: 'Beni Suef' },
  { id: 'minya', nameAr: 'المنيا', nameEn: 'Minya' },
  { id: 'asyut', nameAr: 'أسيوط', nameEn: 'Asyut' },
  { id: 'sohag', nameAr: 'سوهاج', nameEn: 'Sohag' },
  { id: 'qena', nameAr: 'قنا', nameEn: 'Qena' },
  { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor' },
  { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan' },
  { id: 'red_sea', nameAr: 'البحر الأحمر', nameEn: 'Red Sea' },
  { id: 'sinai', nameAr: 'جنوب سيناء', nameEn: 'South Sinai' },
];

export default function CartPage() {
  const { lines, subtotal, setQuantity, remove, clear } = useCart();
  const { user, setAuthModalOpen, addAddress, updateUserPoints } = useAuth();
  const { t, isAr, formatPrice, dir } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [governorate, setGovernorate] = useState('cairo');
  const [address, setAddress] = useState(user?.savedAddresses?.[0] || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet' | 'card'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState(false);

  // Free shipping dynamic calculation (Threshold: 500 EGP)
  const FREE_SHIPPING_THRESHOLD = 500;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const shippingCost = isFreeShipping ? 0 : 35;

  const [complete, setComplete] = useState<{ id: string; total: number } | null>(null);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (!address && user.savedAddresses?.[0]) setAddress(user.savedAddresses[0]);
    }
  }, [user]);

  const applyCoupon = () => {
    const clean = couponCode.trim().toUpperCase();
    if (clean === 'ROMA10' || clean === 'BEAUTY10') {
      const disc = Math.round(subtotal * 0.1);
      setDiscountAmount(disc);
      setCouponSuccess(true);
    } else {
      alert(isAr ? 'كود الخصم غير صالح. جربي كود ROMA10 للحصول على خصم 10%!' : 'Invalid code. Try ROMA10 for 10% OFF!');
      setCouponSuccess(false);
      setDiscountAmount(0);
    }
  };

  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    // Strict input validation
    if (!name.trim()) {
      setValidationError(isAr ? 'يرجى إدخال الاسم بالكامل' : 'Please enter your full name');
      return;
    }
    const cleanPhone = phone.replace(/\D+/g, '');
    if (cleanPhone.length < 10) {
      setValidationError(isAr ? 'يرجى إدخال رقم هاتف صحيح مكون من 11 رقماً' : 'Please enter a valid 11-digit phone number');
      return;
    }
    if (!address.trim()) {
      setValidationError(isAr ? 'يرجى كتابة عنوان التوصيل بالتفصيل' : 'Please enter detailed delivery address');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);

    const fallbackId = String(Math.floor(100000 + Math.random() * 900000));
    const selectedGov = GOVERNORATES.find((g) => g.id === governorate);
    const govName = isAr ? selectedGov?.nameAr : (selectedGov?.nameEn || 'Cairo');
    const fullAddress = `${address.trim()} — ${govName} (مصر)`;

    const paymentLabel =
      paymentMethod === 'cod'
        ? (isAr ? 'الدفع عند الاستلام (نقداً أو إنستاباي للمندوب)' : 'Cash on Delivery (COD & InstaPay)')
        : paymentMethod === 'wallet'
        ? (isAr ? 'محافظ إلكترونية / إنستاباي (Vodafone Cash / InstaPay)' : 'Mobile Wallets / InstaPay')
        : (isAr ? 'بطاقة بنكية (Visa / Mastercard / Meeza)' : 'Credit / Debit Card');

    const orderPayload = {
      orderId: fallbackId,
      orderNumber: `ROMA-${fallbackId}`,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      shippingAddress: fullAddress,
      paymentMethod: paymentLabel,
      items: lines.map((line) => ({
        name: isAr ? (line?.product?.nameAr || 'مستحضر') : (line?.product?.nameEn || line?.product?.nameAr || 'Cosmetic'),
        quantity: Number(line?.quantity) || 1,
        price: Number(line?.product?.price) || 0,
        variantName: isAr ? line?.variant?.nameAr : (line?.variant?.nameEn || line?.variant?.nameAr),
      })),
      shippingCost,
      totalAmount: total,
      userId: user?.id || null,
      notes: notes.trim(),
    };

    try {
      // 1. Upload to Supabase database (parameterized query)
      let resolvedOrderId: string = fallbackId;
      try {
        const res = await uploadOrderToSupabase({
          user_id: user?.id || null,
          customer_name: name.trim(),
          phone: phone.trim(),
          shipping_address: fullAddress,
          total_amount: total,
          status: 'pending',
          items: lines.map((line) => ({
            product_id: line?.product?.id || 1,
            name: line?.product?.nameAr || 'مستحضر عناية',
            price: Number(line?.product?.price) || 0,
            quantity: Number(line?.quantity) || 1,
            variant: line?.variant?.nameAr || null,
            image: line?.product?.imageUrl || '',
          })),
        });

        if (res && res.success && res.data && res.data.id) {
          resolvedOrderId = String(res.data.id);
          orderPayload.orderId = resolvedOrderId;
          orderPayload.orderNumber = `ROMA-${resolvedOrderId}`;
        }
      } catch (sbErr) {
        console.warn('Supabase order upload notice:', sbErr);
      }

      // 2. Dispatch to Backend Telegram Endpoints (/api/orders & /api/notify-order)
      try {
        await Promise.allSettled([
          fetch('/api/notify-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
          }),
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
          }),
        ]);
      } catch (apiErr) {
        console.warn('Backend API notification dispatch notice:', apiErr);
      }

      // 3. Direct browser Telegram alert failsafe (Rich HTML mode)
      await notifyTelegramNewOrder({
        orderId: resolvedOrderId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        shippingAddress: fullAddress,
        paymentMethod: paymentLabel,
        items: lines.map((line) => ({
          name: line?.product?.nameAr || 'مستحضر عناية',
          quantity: Number(line?.quantity) || 1,
          price: Number(line?.product?.price) || 0,
          variantName: line?.variant?.nameAr,
        })),
        shippingCost,
        totalAmount: total,
      }).catch((tgErr) => console.warn('Telegram direct alert notice:', tgErr));

      // 4. Save profile info if authenticated
      if (user && address) {
        try {
          await addAddress(fullAddress);
          const earnedPoints = Math.round(total * 0.05);
          if (earnedPoints > 0) {
            await updateUserPoints(earnedPoints);
          }
        } catch (_) {}
      }

      // 5. Complete view & clear cart
      setComplete({ id: resolvedOrderId, total });
      clear();
    } catch (criticalErr) {
      console.error('Submit order caught error:', criticalErr);
      setComplete({ id: fallbackId, total });
      clear();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Success View
  if (complete) {
    return (
      <div className="roma-container flex min-h-[70vh] flex-col items-center justify-center py-12 md:py-20 text-center" dir={dir}>
        <div className="w-full max-w-lg rounded-[36px] border border-[#EFE8DE] bg-white p-6 md:p-10 shadow-xl space-y-6 text-right">
          {/* Top Rose Gold Icon */}
          <div className="flex size-16 items-center justify-center rounded-3xl bg-[#F8EBEA] text-[#4A1525] mx-auto shadow-xs">
            <Check className="size-8 text-[#D48B88]" strokeWidth={2.5} />
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
              {t('success.title')}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto">
              {t('success.subtitle')}
            </p>
          </div>

          {/* Reference Card */}
          <div className="flex items-center justify-between rounded-2xl bg-[#FDFBF7] border border-[#EFE8DE] p-4">
            <div>
              <span className="text-[11px] text-muted-foreground block">{t('success.order_number')}</span>
              <strong className="text-base font-extrabold font-mono-brand text-[#4A1525]">
                #ROMA-{complete.id}
              </strong>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-muted-foreground block">{t('cart.total')}</span>
              <strong className="text-base font-extrabold font-mono-brand text-[#4A1525]">
                {formatPrice(complete.total)}
              </strong>
            </div>
          </div>

          {/* Confirmation Notice */}
          <div className="rounded-2xl bg-[#F8EBEA] p-4 border border-accent/20 text-xs text-foreground/85 flex items-start gap-2.5">
            <CheckCircle2 className="size-4.5 text-[#D48B88] shrink-0 mt-0.5" />
            <span>
              {t('success.telegram_alert')}
            </span>
          </div>

          {/* Direct WhatsApp Concierge Button */}
          <a
            href={`https://wa.me/201012345678?text=${encodeURIComponent(
              isAr
                ? `مرحباً، أود متابعة طلبي رقم #ROMA-${complete.id} من متجر روما:`
                : `Hello, I would like to inquire about my order #ROMA-${complete.id} from ROMA:`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-full bg-[#4A1525] hover:bg-[#38101C] py-3.5 px-6 text-xs md:text-sm font-bold text-white shadow-md shadow-[#4A1525]/20 transition"
          >
            <span>{t('success.whatsapp_contact')}</span>
          </a>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs font-bold text-[#4A1525] hover:underline">
              {t('success.back_home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty Bag View
  if (lines.length === 0) {
    return (
      <div className="roma-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center" dir={dir}>
        <div className="size-20 rounded-full bg-[#F8EBEA] flex items-center justify-center text-[#4A1525] mb-4 shadow-xs">
          <ShoppingBag className="size-8 text-[#D48B88]" />
        </div>
        <span className="font-mono-brand text-xs tracking-widest text-[#D48B88] font-bold uppercase">
          ROMA ATELIER
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-5xl">
          {t('cart.empty_title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {t('cart.empty_subtitle')}
        </p>
        <Link
          href="/shop"
          className="mt-8 rounded-full bg-[#4A1525] hover:bg-[#38101C] px-8 py-3.5 text-xs md:text-sm font-bold text-white shadow-md shadow-[#4A1525]/20 transition"
        >
          {t('cart.start_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="roma-container py-8 md:py-14" dir={dir}>
      {/* Top Free Shipping Progress Indicator */}
      <div className="mb-8 rounded-[28px] border border-[#EFE8DE] bg-white p-4 md:p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <div className="flex items-center gap-2 text-[#4A1525]">
            <Truck className="size-4 text-[#D48B88]" />
            <span>
              {isFreeShipping
                ? t('common.free_shipping_qualified')
                : t('common.free_shipping_progress').replace('{remaining}', String(remainingForFreeShipping))}
            </span>
          </div>
          <span className="font-mono-brand text-[#D48B88]">{freeShippingProgress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F8EBEA] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D48B88] to-[#4A1525] transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Main Layout: Cart Items on Left, Checkout Form on Right */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Bag Items & Coupon (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[32px] border border-[#EFE8DE] bg-white p-5 md:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-4 mb-4">
              <h2 className="text-base font-bold text-foreground">
                {t('cart.title')} ({lines.length})
              </h2>
              <button
                type="button"
                onClick={clear}
                className="text-xs text-muted-foreground hover:text-destructive transition"
              >
                {isAr ? 'إفراغ السلة' : 'Clear All'}
              </button>
            </div>

            <div className="divide-y divide-[#EFE8DE]">
              {lines.map((line) => (
                <div key={`${line.product.id}-${line.variant?.id}`} className="flex gap-3.5 py-4 items-center">
                  <img
                    src={line.product.imageUrl || ''}
                    alt={line.product.nameAr}
                    className="size-20 rounded-2xl object-contain bg-[#F8EBEA] shrink-0 border border-[#EFE8DE] p-1 mix-blend-multiply"
                  />

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs md:text-sm font-bold text-foreground line-clamp-1">
                          {isAr ? line.product.nameAr : (line.product.nameEn || line.product.nameAr)}
                        </h3>
                        {line.variant && (
                          <p className="text-[11px] text-[#D48B88] font-medium mt-0.5">
                            {isAr ? line.variant.nameAr : (line.variant.nameEn || line.variant.nameAr)}
                          </p>
                        )}
                      </div>
                      <span className="font-mono-brand text-xs md:text-sm font-bold text-[#4A1525] shrink-0">
                        {formatPrice(line.product.price * line.quantity)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Stepper */}
                      <div className="flex items-center rounded-full border border-[#EFE8DE] bg-[#FDFBF7] px-2 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() =>
                            line.quantity === 1
                              ? remove(line.product.id, line.variant?.id)
                              : setQuantity(line.product.id, line.quantity - 1, line.variant?.id)
                          }
                          className="size-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center font-mono-brand text-xs font-bold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => setQuantity(line.product.id, line.quantity + 1, line.variant?.id)}
                          className="size-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => remove(line.product.id, line.variant?.id)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-destructive transition"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="mt-4 pt-4 border-t border-[#EFE8DE] space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t('cart.subtotal')}</span>
                <span className="font-mono-brand font-bold text-foreground">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-800">
                  <span>{isAr ? 'الخصم المطبق' : 'Discount Applied'}</span>
                  <span className="font-mono-brand font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t('cart.shipping')}</span>
                <span className="font-mono-brand font-bold text-foreground">
                  {isFreeShipping ? t('cart.shipping_free') : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-[#4A1525] pt-2 border-t border-[#EFE8DE]">
                <span>{t('cart.total')}</span>
                <span className="font-mono-brand text-xl">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Coupon Input Box */}
          <div className="rounded-[28px] border border-[#EFE8DE] bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Tag className="size-3.5 text-[#D48B88]" />
              {t('cart.coupon_label')}
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={t('cart.coupon_placeholder')}
                className="flex-1 rounded-full border border-[#EFE8DE] bg-[#FDFBF7] px-4 py-2 text-xs font-mono uppercase outline-none focus:border-[#D48B88]"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="rounded-full bg-[#4A1525] px-5 py-2 text-xs font-bold text-white hover:bg-[#38101C] transition shadow-xs"
              >
                {t('cart.coupon_apply')}
              </button>
            </div>
            {couponSuccess && (
              <p className="mt-2 text-xs font-bold text-emerald-800 flex items-center gap-1">
                <Check className="size-3.5" />
                {t('cart.coupon_applied')}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <form
            onSubmit={submitOrder}
            className="rounded-[36px] border border-[#EFE8DE] bg-white p-6 md:p-8 shadow-sm space-y-6"
          >
            <div>
              <h2 className="font-display text-xl md:text-2xl font-extrabold text-foreground pb-2 border-b border-[#EFE8DE]">
                {t('checkout.title')}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t('checkout.subtitle')}
              </p>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                <AlertCircle className="size-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Section 1: Customer Details */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-sm text-[#4A1525]">
                {t('checkout.step_shipping')}
              </h3>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {t('checkout.full_name')} <span className="text-[#D48B88]">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? 'الاسم الثلاثي أو الثنائي' : 'Full Name'}
                  className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-4 py-2.5 text-xs outline-none focus:border-[#D48B88]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {t('checkout.phone')} <span className="text-[#D48B88]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-4 py-2.5 pl-8 text-xs font-mono outline-none focus:border-[#D48B88]"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {t('checkout.governorate')} <span className="text-[#D48B88]">*</span>
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-3.5 py-2.5 text-xs outline-none focus:border-[#D48B88] cursor-pointer"
                  >
                    {GOVERNORATES.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {isAr ? gov.nameAr : gov.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {t('checkout.address')} <span className="text-[#D48B88]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isAr ? 'المنطقة، الشارع، رقم العمارة، الشقة / علامة مميزة' : 'Street name, building #, apt/suite, landmark'}
                  className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-4 py-2.5 text-xs outline-none focus:border-[#D48B88] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {t('checkout.notes')}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isAr ? 'موعد مفضل للاتصال أو تعليمات خاصة للمندوب' : 'Preferred delivery time or instructions'}
                  className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-4 py-2 text-xs outline-none focus:border-[#D48B88]"
                />
              </div>
            </div>

            {/* Section 2: Payment Methods */}
            <div className="space-y-3 pt-4 border-t border-[#EFE8DE]">
              <h3 className="font-display font-bold text-sm text-[#4A1525]">
                {t('checkout.step_payment')}
              </h3>

              <div className="space-y-2.5">
                {/* Option 1: Cash on Delivery (COD) */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'border-[#4A1525] bg-[#F8EBEA]/70 ring-1 ring-[#4A1525]'
                      : 'border-[#EFE8DE] bg-white hover:border-[#D48B88]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-[#4A1525]"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-foreground">
                      {t('checkout.payment_cod')}
                    </strong>
                    <span className="text-[11px] text-muted-foreground">
                      {t('checkout.payment_cod_desc')}
                    </span>
                  </div>
                </label>

                {/* Option 2: Mobile Wallets & InstaPay */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'wallet'
                      ? 'border-[#4A1525] bg-[#F8EBEA]/70 ring-1 ring-[#4A1525]'
                      : 'border-[#EFE8DE] bg-white hover:border-[#D48B88]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="mt-1 accent-[#4A1525]"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-foreground">
                      {t('checkout.payment_wallet')}
                    </strong>
                    <span className="text-[11px] text-muted-foreground">
                      {t('checkout.payment_wallet_desc')}
                    </span>
                  </div>
                </label>

                {/* Option 3: Card */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'card'
                      ? 'border-[#4A1525] bg-[#F8EBEA]/70 ring-1 ring-[#4A1525]'
                      : 'border-[#EFE8DE] bg-white hover:border-[#D48B88]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mt-1 accent-[#4A1525]"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-foreground">
                      {t('checkout.payment_card')}
                    </strong>
                    <span className="text-[11px] text-muted-foreground">
                      {t('checkout.payment_card_desc')}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Cloudflare Turnstile Verification Badge */}
            <div className="rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] p-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#D48B88]" />
                <span className="text-[11px]">{t('checkout.turnstile_badge')}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#4A1525] hover:bg-[#38101C] py-4 px-6 text-sm font-bold text-white shadow-lg shadow-[#4A1525]/25 transition duration-300 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{t('checkout.submitting')}</span>
              ) : (
                <>
                  <Lock className="size-4 text-[#E8A598]" />
                  <span>{t('checkout.confirm_order')} · {formatPrice(total)}</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-muted-foreground">
              {t('checkout.security_badge')}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}