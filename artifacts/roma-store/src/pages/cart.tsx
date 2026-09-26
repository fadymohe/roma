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
  Upload,
  Copy,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
} from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { notifyTelegramNewOrder } from '@/lib/telegram';
import { uploadOrderToSupabase, supabase } from '@/lib/supabase';

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

  // Customer shipping fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [altPhone, setAltPhone] = useState('');
  const [governorate, setGovernorate] = useState('cairo');
  const [address, setAddress] = useState(user?.savedAddresses?.[0] || '');
  const [notes, setNotes] = useState('');

  // 4 Egyptian payment methods
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vodafone_cash' | 'instapay' | 'fawry'>('cod');
  
  // Specific inputs for local payments
  const [vodafoneSenderNumber, setVodafoneSenderNumber] = useState('');
  const [instapayReference, setInstapayReference] = useState('');
  const [fawryCode] = useState(() => `999${Math.floor(1000000 + Math.random() * 9000000)}`);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const [complete, setComplete] = useState<{ id: string; total: number; method: string } | null>(null);

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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(isAr ? 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت' : 'File is too large, please select under 5MB');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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

    // Payment validation
    if (paymentMethod === 'vodafone_cash' && !vodafoneSenderNumber.trim()) {
      setValidationError(isAr ? 'يرجى إدخال رقم المحفظة التي تم التحويل منها' : 'Please enter the sender wallet phone number');
      return;
    }
    if (paymentMethod === 'instapay' && !instapayReference.trim()) {
      setValidationError(isAr ? 'يرجى إدخال الرقم المرجعي للتحويل عبر إنستاباي' : 'Please enter InstaPay reference transaction code');
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
        ? (isAr ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery')
        : paymentMethod === 'vodafone_cash'
        ? (isAr ? 'فودافون كاش / المحافظ الإلكترونية' : 'Vodafone Cash')
        : paymentMethod === 'instapay'
        ? (isAr ? 'إنستاباي (InstaPay)' : 'InstaPay')
        : (isAr ? 'فوري (Fawry)' : 'Fawry Pay');

    const paymentRef =
      paymentMethod === 'vodafone_cash'
        ? `رقم المحول: ${vodafoneSenderNumber}`
        : paymentMethod === 'instapay'
        ? `مرجع إنستاباي: ${instapayReference}`
        : paymentMethod === 'fawry'
        ? `كود فوري: ${fawryCode}`
        : 'الدفع نقداً للمندوب';

    const orderPayload = {
      orderId: fallbackId,
      orderNumber: `ROMA-${fallbackId}`,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      shippingAddress: fullAddress,
      paymentMethod: paymentLabel,
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'verified',
      paymentReference: paymentRef,
      receiptImage: receiptImage || null,
      items: lines.map((line) => ({
        name: isAr ? (line?.product?.nameAr || 'مستحضر') : (line?.product?.nameEn || line?.product?.nameAr || 'Cosmetic'),
        quantity: Number(line?.quantity) || 1,
        price: Number(line?.product?.price) || 0,
        variantName: isAr ? line?.variant?.nameAr : (line?.variant?.nameEn || line?.variant?.nameAr),
      })),
      shippingCost,
      discountAmount,
      couponUsed: couponSuccess ? couponCode.trim().toUpperCase() : null,
      totalAmount: total,
      userId: user?.id || null,
      notes: notes.trim(),
    };

    try {
      // 1. Upload to Supabase database (parameterized query matching schema)
      let resolvedOrderId: string = fallbackId;
      try {
        const { data: newOrder, error: sbError } = await supabase
          .from('orders')
          .insert({
            order_number: `ROMA-${fallbackId}`,
            user_id: user?.id || null,
            total_amount: total,
            shipping_fee: shippingCost,
            discount_amount: discountAmount,
            coupon_used: couponSuccess ? couponCode.trim().toUpperCase() : null,
            status: 'pending',
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cod' ? 'unpaid' : 'paid',
            payment_reference: paymentRef,
            payment_receipt_url: receiptImage ? 'data:image/jpeg;receipt' : null,
            shipping_details: {
              fullName: name.trim(),
              phone: phone.trim(),
              altPhone: altPhone.trim(),
              city: govName,
              fullAddress,
              notes: notes.trim(),
            },
            notes: notes.trim(),
          })
          .select()
          .single();

        if (!sbError && newOrder?.id) {
          resolvedOrderId = String(newOrder.id);
          orderPayload.orderId = resolvedOrderId;
          orderPayload.orderNumber = `ROMA-${resolvedOrderId.slice(0, 8).toUpperCase()}`;

          // Insert order items
          const orderItemRows = lines.map((l) => ({
            order_id: newOrder.id,
            product_id: typeof l.product.id === 'string' ? l.product.id : null,
            product_name: l.product.nameAr,
            price: l.product.price,
            quantity: l.quantity,
            variant_info: l.variant?.nameAr || null,
            image_url: l.product.imageUrl,
          }));
          await supabase.from('order_items').insert(orderItemRows).catch(() => {});
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

      // 3. Direct browser Telegram alert failsafe with rich details & receipt info
      await notifyTelegramNewOrder({
        orderId: resolvedOrderId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        shippingAddress: fullAddress,
        paymentMethod: `${paymentLabel} (${paymentRef})`,
        items: lines.map((line) => ({
          name: line?.product?.nameAr || 'مستحضر عناية',
          quantity: Number(line?.quantity) || 1,
          price: Number(line?.product?.price) || 0,
          variantName: line?.variant?.nameAr,
        })),
        shippingCost,
        totalAmount: total,
      }).catch((tgErr) => console.warn('Telegram direct alert notice:', tgErr));

      // 4. Mark active carts as converted in Supabase
      if (user?.id) {
        supabase
          .from('carts')
          .update({ status: 'converted' })
          .eq('user_id', user.id)
          .eq('status', 'active')
          .catch(() => {});
      }

      // 5. Save address & points if user logged in
      if (user && address) {
        try {
          await addAddress(fullAddress);
          const earnedPoints = Math.round(total * 0.05);
          if (earnedPoints > 0) {
            await updateUserPoints(earnedPoints);
          }
        } catch (_) {}
      }

      // 6. Complete view & clear cart
      setComplete({ id: resolvedOrderId, total, method: paymentLabel });
      clear();
    } catch (criticalErr) {
      console.error('Submit order caught error:', criticalErr);
      setComplete({ id: fallbackId, total, method: paymentLabel });
      clear();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Success View
  if (complete) {
    return (
      <div className="roma-container flex min-h-[70vh] flex-col items-center justify-center py-12 md:py-20 text-center" dir={dir}>
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#141414] p-6 md:p-10 shadow-2xl space-y-6 text-right relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 size-40 rounded-full bg-[#D4A5A5]/10 blur-3xl pointer-events-none" />

          {/* Top Rose Gold Icon */}
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 text-[#D4A5A5] mx-auto shadow-md">
            <Check className="size-8" strokeWidth={2.5} />
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white">
              {t('success.title')}
            </h2>
            <p className="text-xs md:text-sm text-[#A1A1AA] max-w-sm mx-auto">
              {t('success.subtitle')}
            </p>
          </div>

          {/* Reference Card */}
          <div className="flex items-center justify-between rounded-2xl bg-[#1A1A1A] border border-white/5 p-4">
            <div>
              <span className="text-[11px] text-[#A1A1AA] block">{t('success.order_number')}</span>
              <strong className="text-base font-extrabold font-mono text-[#D4A5A5]">
                #ROMA-{complete.id.slice(0, 8).toUpperCase()}
              </strong>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-[#A1A1AA] block">{t('cart.total')}</span>
              <strong className="text-base font-extrabold font-mono text-white">
                {formatPrice(complete.total)}
              </strong>
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="rounded-2xl bg-[#1A1A1A] p-4 border border-white/5 text-xs text-[#A1A1AA] space-y-1">
            <div className="flex items-center justify-between text-white font-semibold">
              <span>{isAr ? 'طريقة الدفع المختارة:' : 'Payment Method:'}</span>
              <span className="text-[#D4A5A5]">{complete.method}</span>
            </div>
            {paymentMethod === 'vodafone_cash' && (
              <p className="text-[11px] text-emerald-400 pt-1">
                ✓ {isAr ? 'تم استلام بيانات التحويل وسيتم مراجعتها وتأكيد الشحن فوراً.' : 'Transfer recorded, verifying with courier.'}
              </p>
            )}
            {paymentMethod === 'fawry' && (
              <div className="pt-2 text-center">
                <span className="text-[11px] text-[#A1A1AA] block">{isAr ? 'كود السداد عبر فوري:' : 'Fawry Payment Reference:'}</span>
                <span className="text-base font-bold font-mono text-amber-400 bg-amber-950/40 px-3 py-1 rounded-lg inline-block mt-1">
                  {fawryCode}
                </span>
              </div>
            )}
          </div>

          {/* Instant Order Tracking Button */}
          <Link
            href="/account"
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#D4A5A5] hover:bg-[#C89595] py-3.5 px-6 text-xs md:text-sm font-bold text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20 transition"
          >
            <Truck className="size-4" />
            <span>{isAr ? 'متابعة وتتبع حالة طلبي الآن' : 'Track Order Realtime'}</span>
          </Link>

          {/* Direct WhatsApp Concierge Button */}
          <a
            href={`https://wa.me/201012345678?text=${encodeURIComponent(
              isAr
                ? `مرحباً، أود متابعة طلبي رقم #ROMA-${complete.id} من متجر روما:`
                : `Hello, I would like to inquire about my order #ROMA-${complete.id} from ROMA:`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-white/10 bg-[#1A1A1A] hover:bg-white/5 py-3 px-6 text-xs font-semibold text-white transition"
          >
            <span>{t('success.whatsapp_contact')}</span>
          </a>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs font-bold text-[#D4A5A5] hover:underline">
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
        <div className="size-20 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-center text-[#D4A5A5] mb-4 shadow-xl">
          <ShoppingBag className="size-8 text-[#D4A5A5]" />
        </div>
        <span className="font-mono-brand text-xs tracking-widest text-[#D4A5A5] font-bold uppercase">
          ROMA ATELIER
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-white md:text-5xl">
          {t('cart.empty_title')}
        </h1>
        <p className="mt-2 text-sm text-[#A1A1AA] max-w-sm">
          {t('cart.empty_subtitle')}
        </p>
        <Link
          href="/shop"
          className="mt-8 rounded-full bg-[#D4A5A5] hover:bg-[#C89595] px-8 py-3.5 text-xs md:text-sm font-bold text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20 transition"
        >
          {t('cart.start_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="roma-container py-8 md:py-14 text-white" dir={dir}>
      {/* Top Free Shipping Progress Indicator */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-[#141414] p-4 md:p-5 shadow-xl">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <div className="flex items-center gap-2 text-white">
            <Truck className="size-4 text-[#D4A5A5]" />
            <span>
              {isFreeShipping
                ? t('common.free_shipping_qualified')
                : t('common.free_shipping_progress').replace('{remaining}', String(remainingForFreeShipping))}
            </span>
          </div>
          <span className="font-mono-brand text-[#D4A5A5]">{freeShippingProgress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#1A1A1A] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D4A5A5] to-white transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Main Layout: Cart Items on Left, Checkout Form on Right */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Bag Items & Coupon (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 md:p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-base font-bold text-white">
                {t('cart.title')} ({lines.length})
              </h2>
              <button
                type="button"
                onClick={clear}
                className="text-xs text-[#A1A1AA] hover:text-red-400 transition"
              >
                {isAr ? 'إفراغ السلة' : 'Clear All'}
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {lines.map((line) => (
                <div key={`${line.product.id}-${line.variant?.id}`} className="flex gap-3.5 py-4 items-center">
                  <img
                    src={line.product.imageUrl || ''}
                    alt={line.product.nameAr}
                    className="size-20 rounded-2xl object-cover bg-[#1A1A1A] shrink-0 border border-white/10 p-1"
                  />

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs md:text-sm font-bold text-white line-clamp-1">
                          {isAr ? line.product.nameAr : (line.product.nameEn || line.product.nameAr)}
                        </h3>
                        {line.variant && (
                          <p className="text-[11px] text-[#D4A5A5] font-medium mt-0.5">
                            {isAr ? line.variant.nameAr : (line.variant.nameEn || line.variant.nameAr)}
                          </p>
                        )}
                      </div>
                      <span className="font-mono-brand text-xs md:text-sm font-bold text-[#D4A5A5] shrink-0">
                        {formatPrice(line.product.price * line.quantity)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Stepper */}
                      <div className="flex items-center rounded-full border border-white/10 bg-[#1A1A1A] px-2 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() =>
                            line.quantity === 1
                              ? remove(line.product.id, line.variant?.id)
                              : setQuantity(line.product.id, line.quantity - 1, line.variant?.id)
                          }
                          className="size-6 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white active:scale-90"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center font-mono-brand text-xs font-bold text-white">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => setQuantity(line.product.id, line.quantity + 1, line.variant?.id)}
                          className="size-6 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white active:scale-90"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => remove(line.product.id, line.variant?.id)}
                        className="rounded-full p-1.5 text-[#A1A1AA] hover:bg-red-500/10 hover:text-red-400 transition"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-[#A1A1AA]">
                <span>{t('cart.subtotal')}</span>
                <span className="font-mono-brand text-white font-bold">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-[#D4A5A5]">
                  <span>{isAr ? 'خصم القسيمة (10%):' : 'Discount Applied:'}</span>
                  <span className="font-mono-brand font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#A1A1AA]">
                <span>{isAr ? 'رسوم الشحن والتوصيل:' : 'Express Shipping:'}</span>
                <span className="font-mono-brand text-white font-bold">
                  {shippingCost === 0 ? (
                    <span className="text-emerald-400 font-bold">{isAr ? 'شحن مجاني' : 'FREE'}</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-white/10 pt-3 text-sm font-bold text-white">
                <span>{t('cart.total')}</span>
                <span className="font-mono-brand text-base font-extrabold text-[#D4A5A5]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Coupon input */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={isAr ? 'كود الخصم (مثال: ROMA10)' : 'Promo Code (e.g. ROMA10)'}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-xl bg-[#1A1A1A] hover:bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-bold text-white transition shrink-0"
                >
                  {isAr ? 'تطبيق' : 'Apply'}
                </button>
              </div>
              {couponSuccess && (
                <span className="text-[11px] text-[#D4A5A5] block mt-1.5 flex items-center gap-1 font-semibold">
                  <Check className="size-3" /> {isAr ? 'تم تطبيق خصم 10% بنجاح!' : '10% discount applied!'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Form & Egyptian Payment Workflows (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={submitOrder} className="rounded-3xl border border-white/10 bg-[#141414] p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg md:text-xl font-bold font-display text-white">
                {isAr ? 'بيانات الشحن والدفع (مصر)' : 'Shipping & Egyptian Payment'}
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-1">
                {isAr
                  ? 'توصيل فوري لباب المنزل خلال 24 - 48 ساعة لجميع المحافظات المصرية.'
                  : 'Fast doorstep delivery across all Egyptian governorates.'}
              </p>
            </div>

            {validationError && (
              <div className="rounded-2xl bg-red-950/50 border border-red-800/50 p-3.5 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="size-4 text-red-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Shipping Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                    {isAr ? 'الاسم بالكامل' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? 'اسم المستلم...' : 'Receiver name...'}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                    {isAr ? 'رقم الهاتف المحمول (للتواصل)' : 'Mobile Phone'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                    {isAr ? 'المحافظة' : 'Governorate'} *
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white outline-none focus:border-[#D4A5A5]"
                  >
                    {GOVERNORATES.map((g) => (
                      <option key={g.id} value={g.id} className="bg-[#141414] text-white">
                        {isAr ? g.nameAr : g.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                    {isAr ? 'رقم هاتف بديل (اختياري)' : 'Alt Phone (optional)'}
                  </label>
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                  {isAr ? 'العنوان التفصيلي (المنطقة، الشارع، رقم العمارة والشقة)' : 'Detailed Address'} *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isAr ? 'مثال: المعادي الجديدة، شارع النصر، عمارة 14 الدور الثالث...' : 'Street address, building, apartment...'}
                  className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                  {isAr ? 'ملاحظات خاصة للمندوب (اختياري)' : 'Delivery Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isAr ? 'الاتصال قبل الوصول، مواعيد التواجد...' : 'Call before arrival, preferred delivery time...'}
                  className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. CHECKOUT & EGYPTIAN LOCAL PAYMENT WORKFLOWS                            */}
            {/* [COD, Vodafone Cash, InstaPay, Fawry]                                     */}
            {/* ========================================================================= */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <label className="text-xs font-bold text-white block">
                {isAr ? 'اختاري طريقة الدفع:' : 'Select Payment Method:'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Cash on Delivery (COD) */}
                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'border-[#D4A5A5] bg-[#D4A5A5]/10 shadow-sm'
                      : 'border-white/10 bg-[#1A1A1A] hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-[#D4A5A5]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Banknote className="size-4 text-[#D4A5A5]" />
                      <span>{isAr ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery'}</span>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                      {isAr
                        ? 'الدفع نقداً أو إنستاباي للمندوب عند استلام ومعاينة الطلب.'
                        : 'Pay cash or InstaPay to courier upon package delivery.'}
                    </p>
                  </div>
                </label>

                {/* 2. Vodafone Cash / Wallets */}
                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'vodafone_cash'
                      ? 'border-[#D4A5A5] bg-[#D4A5A5]/10 shadow-sm'
                      : 'border-white/10 bg-[#1A1A1A] hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="vodafone_cash"
                    checked={paymentMethod === 'vodafone_cash'}
                    onChange={() => setPaymentMethod('vodafone_cash')}
                    className="mt-1 accent-[#D4A5A5]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Smartphone className="size-4 text-[#D4A5A5]" />
                      <span>{isAr ? 'فودافون كاش ومحافظ المحمول' : 'Vodafone Cash / Wallets'}</span>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                      {isAr
                        ? 'تحويل فوري إلى محفظة روما المعتمدة ورفع إشعار التحويل.'
                        : 'Transfer to official ROMA wallet & attach receipt.'}
                    </p>
                  </div>
                </label>

                {/* 3. InstaPay */}
                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'instapay'
                      ? 'border-[#D4A5A5] bg-[#D4A5A5]/10 shadow-sm'
                      : 'border-white/10 bg-[#1A1A1A] hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="instapay"
                    checked={paymentMethod === 'instapay'}
                    onChange={() => setPaymentMethod('instapay')}
                    className="mt-1 accent-[#D4A5A5]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <CreditCard className="size-4 text-[#D4A5A5]" />
                      <span>{isAr ? 'إنستاباي (InstaPay IPN)' : 'InstaPay Transfer'}</span>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                      {isAr
                        ? 'تحويل لحظي من أي بنك مصري عبر عنوان الدفع اللحظي.'
                        : 'Instant bank transfer via InstaPay IPN address.'}
                    </p>
                  </div>
                </label>

                {/* 4. Fawry */}
                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'fawry'
                      ? 'border-[#D4A5A5] bg-[#D4A5A5]/10 shadow-sm'
                      : 'border-white/10 bg-[#1A1A1A] hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="fawry"
                    checked={paymentMethod === 'fawry'}
                    onChange={() => setPaymentMethod('fawry')}
                    className="mt-1 accent-[#D4A5A5]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <QrCode className="size-4 text-[#D4A5A5]" />
                      <span>{isAr ? 'فوري (Fawry Pay)' : 'Fawry Pay'}</span>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                      {isAr
                        ? 'رقم سداد فوري لإتمام الدفع من أقرب ماكينة أو كشك فوري.'
                        : 'Get a reference code to pay at any Fawry kiosk or POS.'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Dynamic Sub-Sections for Selected Egyptian Payment Method */}
              {paymentMethod === 'vodafone_cash' && (
                <div className="rounded-2xl border border-[#D4A5A5]/30 bg-[#1A1A1A] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#A1A1AA] block">{isAr ? 'رقم محفظة فودافون كاش لمتجر روما:' : 'ROMA Vodafone Cash Wallet:'}</span>
                      <strong className="text-base font-bold text-[#D4A5A5] font-mono">01012345678</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('01012345678', 'voda')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10"
                    >
                      <Copy className="size-3.5" />
                      <span>{copiedKey === 'voda' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرقم' : 'Copy')}</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                      {isAr ? 'رقم المحفظة التي قمتِ بالتحويل منها:' : 'Your Sender Wallet Phone Number:'} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={vodafoneSenderNumber}
                      onChange={(e) => setVodafoneSenderNumber(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                      {isAr ? 'إرفاق لقطة شاشة إيصال التحويل (اختياري لتسريع التأكيد):' : 'Upload Receipt Screenshot (optional):'}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-[#141414] hover:bg-white/5 text-xs text-white cursor-pointer transition">
                        <Upload className="size-3.5 text-[#D4A5A5]" />
                        <span>{receiptFileName ? receiptFileName : (isAr ? 'اختيار صورة الإيصال' : 'Choose Receipt Image')}</span>
                        <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                      </label>
                      {receiptImage && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="size-3.5" /> {isAr ? 'تمت إضافة الإيصال' : 'Attached'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'instapay' && (
                <div className="rounded-2xl border border-[#D4A5A5]/30 bg-[#1A1A1A] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#A1A1AA] block">{isAr ? 'عنوان إنستاباي لمتجر روما (IPA):' : 'ROMA InstaPay Address (IPA):'}</span>
                      <strong className="text-base font-bold text-[#D4A5A5] font-mono">roma.beauty@instapay</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('roma.beauty@instapay', 'insta')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10"
                    >
                      <Copy className="size-3.5" />
                      <span>{copiedKey === 'insta' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ العنوان' : 'Copy')}</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                      {isAr ? 'الرقم المرجعي للتحويل (Reference / Transaction ID):' : 'Transaction Reference Code:'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={instapayReference}
                      onChange={(e) => setInstapayReference(e.target.value)}
                      placeholder={isAr ? 'مثال: IPN123456789' : 'e.g. IPN123456789'}
                      className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                      {isAr ? 'إرفاق لقطة شاشة العملية (اختياري لتسريع التأكيد):' : 'Upload Receipt Screenshot (optional):'}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-[#141414] hover:bg-white/5 text-xs text-white cursor-pointer transition">
                        <Upload className="size-3.5 text-[#D4A5A5]" />
                        <span>{receiptFileName ? receiptFileName : (isAr ? 'اختيار صورة الإيصال' : 'Choose Receipt Image')}</span>
                        <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                      </label>
                      {receiptImage && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="size-3.5" /> {isAr ? 'تمت إضافة الإيصال' : 'Attached'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'fawry' && (
                <div className="rounded-2xl border border-[#D4A5A5]/30 bg-[#1A1A1A] p-4 space-y-3 text-center sm:text-right">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#A1A1AA] block">{isAr ? 'كود السداد عبر فوري (Fawry Reference):' : 'Fawry Pay Code:'}</span>
                      <strong className="text-lg font-bold text-amber-400 font-mono tracking-widest">{fawryCode}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fawryCode, 'fawry')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10"
                    >
                      <Copy className="size-3.5" />
                      <span>{copiedKey === 'fawry' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy')}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    {isAr
                      ? 'يمكنك التوجه لأي كشك أو ماكينة فوري واختيار "مدفوعات فوري باي" وإدخال هذا الكود خلال 48 ساعة لإتمام الطلب.'
                      : 'Provide this code at any Fawry merchant under "Fawry Pay" within 48 hours to confirm order.'}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#D4A5A5] hover:bg-[#C89595] py-4 px-6 text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#D4A5A5]/25 transition active:scale-[0.99] disabled:opacity-60"
              >
                <Lock className="size-4" />
                <span>
                  {isSubmitting
                    ? isAr
                      ? 'جاري تأكيد وتسجيل الطلب...'
                      : 'Processing Order...'
                    : isAr
                    ? `تأكيد الطلب الآن (${formatPrice(total)})`
                    : `Confirm Order Now (${formatPrice(total)})`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}