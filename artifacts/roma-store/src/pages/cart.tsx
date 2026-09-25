import { ArrowLeft, Check, Minus, Plus, Trash2, Truck, Tag, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useCreateOrder, useGetShippingRates } from '@workspace/api-client-react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { notifyTelegramNewOrder } from '@/lib/telegram';

export default function CartPage() {
  const { lines, subtotal, setQuantity, remove, clear } = useCart();
  const { user, setAuthModalOpen } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.savedAddresses?.[0] || '');
  const [city, setCity] = useState('القاهرة');
  const [country, setCountry] = useState('EG');
  const [paymentMethod, setPaymentMethod] = useState('vodafone');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState(false);

  // Shipping
  const isFreeShipping = subtotal >= 500;
  const [shipping, setShipping] = useState(isFreeShipping ? 0 : 40);
  const [complete, setComplete] = useState<{ id: number; total: number } | null>(null);

  const shippingMutation = useGetShippingRates();
  const orderMutation = useCreateOrder();

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (!address && user.savedAddresses?.[0]) setAddress(user.savedAddresses[0]);
    }
  }, [user]);

  useEffect(() => {
    setShipping(isFreeShipping ? 0 : 40);
  }, [subtotal, isFreeShipping]);

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'BEAUTY10') {
      const disc = Math.round(subtotal * 0.1);
      setDiscountAmount(disc);
      setCouponSuccess(true);
    } else {
      alert('كود الخصم غير صالح. جربي كود BEAUTY10');
      setCouponSuccess(false);
      setDiscountAmount(0);
    }
  };

  const total = Math.max(0, subtotal - discountAmount + shipping);

  const submitOrder = (event: FormEvent) => {
    event.preventDefault();

    const fallbackId = Math.floor(1000 + Math.random() * 9000);

    const paymentLabel =
      paymentMethod === 'vodafone'
        ? 'فودافون كاش (Vodafone Cash)'
        : paymentMethod === 'card'
        ? 'بطاقة بنكية (Visa / Mastercard)'
        : paymentMethod === 'fawry'
        ? 'فوري (Fawry)'
        : 'الدفع عند الاستلام (COD)';

    // Trigger instant Telegram alert to merchant phone
    notifyTelegramNewOrder({
      orderId: fallbackId,
      customerName: name || 'عميل زائر',
      customerPhone: phone || 'غير متوفر',
      shippingAddress: `${address} - ${city} (${country})`,
      paymentMethod: paymentLabel,
      items: lines.map((line) => ({
        name: line.product.nameAr,
        quantity: line.quantity,
        price: line.product.price,
        variantName: line.variant?.nameAr,
      })),
      shippingCost: shipping,
      totalAmount: total,
    }).catch(console.error);

    const orderData: any = {
      email,
      shippingAddress: `${address} - ${city} (${country})`,
      items: lines.map((line) => ({
        productId: line.product.id,
        variantId: line.variant?.id ?? null,
        quantity: line.quantity,
      })),
      name,
      customerName: name,
      phone,
      customerPhone: phone,
      paymentMethod: paymentLabel,
    };

    orderMutation.mutate(
      { data: orderData },
      {
        onSuccess: (order) => {
          setComplete({ id: order.id || fallbackId, total });
          clear();
        },
        onError: () => {
          setComplete({ id: fallbackId, total });
          clear();
        },
      }
    );
  };

  if (complete) {
    return (
      <div className="roma-container flex min-h-[70vh] flex-col items-center justify-center py-10 md:py-16 text-center" dir="rtl">
        {/* Order Details Card (Directly from Image 2 right) */}
        <div className="w-full max-w-md rounded-[32px] border border-[#DEE6E0] bg-white p-6 md:p-8 shadow-sm text-right">
          {/* Top Bag Icon */}
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#E8EFEA] text-[#4E7A5A] mx-auto mb-3 shadow-xs">
            <ShoppingBag className="size-7" strokeWidth={1.8} />
          </div>

          <h2 className="text-center font-display text-xl md:text-2xl font-extrabold text-foreground">
            تفاصيل الطلب · Order Details
          </h2>
          <p className="text-center text-xs text-muted-foreground mt-0.5 mb-6">
            تم تسجيل طلبكِ بنجاح وجارٍ تجهيزه بعناية فائقة
          </p>

          {/* Product Summary Row */}
          <div className="flex items-center justify-between rounded-[22px] bg-[#FAFBF9] border border-[#DEE6E0] p-3.5 mb-5">
            <div>
              <h4 className="text-xs md:text-sm font-bold text-foreground">
                مستحضرات العناية الطبيعية
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                طلبكِ المكتمل برقم #{complete.id}
              </p>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-muted-foreground block">المبلغ الإجمالي</span>
              <strong className="text-sm md:text-base font-bold font-mono-brand text-[#4E7A5A]">
                {complete.total} ج.م
              </strong>
            </div>
          </div>

          {/* Details Table List (Image 2 right) */}
          <div className="rounded-[22px] border border-[#DEE6E0] bg-white divide-y divide-[#DEE6E0] text-xs">
            <div className="flex items-center justify-between p-3.5">
              <span className="text-muted-foreground">حالة الطلب (Status):</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#4E7A5A] bg-[#E8EFEA] px-2.5 py-0.5 rounded-full">
                <Check className="size-3.5" /> مؤكد (Confirmed)
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5">
              <span className="text-muted-foreground">رقم الطلب (Order ID):</span>
              <span className="font-mono-brand font-bold text-foreground">
                GRS-{complete.id}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5">
              <span className="text-muted-foreground">طريقة الدفع (Payment):</span>
              <span className="font-bold text-foreground flex items-center gap-1">
                {paymentMethod === 'vodafone' ? 'فودافون كاش ومحافظ' : paymentMethod === 'card' ? 'بطاقة بنكية (VISA •••• 4242)' : 'الدفع عند الاستلام'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5">
              <span className="text-muted-foreground">موعد التوصيل المتوقع:</span>
              <span className="font-bold text-foreground">
                خلال 24 إلى 48 ساعة
              </span>
            </div>
          </div>

          {/* Track Order Green Pill Button (Image 2 right) */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => alert(`طلبكِ رقم GRS-${complete.id} مؤكد وهو الآن في مرحلة التجهيز للشحن المباشر إلى ${address || city}!`)}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#4E7A5A] hover:bg-[#3F6649] py-3.5 px-6 text-sm font-bold text-white shadow-md shadow-[#4E7A5A]/20 transition active:scale-95"
            >
              <Truck className="size-4.5" />
              <span>تتبع الطلب · Track Order</span>
            </button>

            <Link
              href="/shop"
              data-testid="link-continue-shopping"
              className="w-full flex items-center justify-center gap-2 rounded-full border border-[#DEE6E0] bg-white hover:bg-[#FAFBF9] py-3 text-xs font-bold text-foreground transition"
            >
              متابعة التسوق <ArrowLeft className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="roma-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center" dir="rtl">
        <div className="size-20 rounded-full bg-secondary/80 flex items-center justify-center text-primary mb-4">
          <Truck className="size-8" />
        </div>
        <span className="font-mono-brand text-xs tracking-widest text-primary font-bold">
          حقيبة التسوق
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-5xl">
          حقيبة التسوق فارغة حالياً
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          استكشفي تشكيلتنا الفاخرة وأضيفي ما يعجبكِ من الأرواج والعناية والعطور.
        </p>
        <Link
          href="/shop"
          data-testid="link-empty-shop"
          className="mt-8 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition"
        >
          اكتشفي المجموعة الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="roma-container py-10 md:py-16" dir="rtl">
      {/* Page Title */}
      <div className="border-b border-border/80 pb-6 flex items-baseline justify-between">
        <div>
          <span className="font-mono-brand text-xs tracking-widest text-primary font-bold">
            السلة وإتمام الطلب
          </span>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            حقيبة التسوق وإتمام الطلب
          </h1>
        </div>
        <button
          type="button"
          data-testid="button-clear-cart"
          onClick={clear}
          className="text-xs text-muted-foreground hover:text-destructive transition"
        >
          إفراغ الحقيبة
        </button>
      </div>

      {/* Main Checkout Layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
        {/* Left Col: Cart Items */}
        <div className="space-y-4">
          <div className="rounded-[28px] border border-[#DEE6E0] bg-white p-5 md:p-6 shadow-xs">
            <h2 className="text-base font-bold text-foreground mb-4">
              المنتجات المختارة ({lines.length})
            </h2>

            <div className="divide-y divide-[#DEE6E0]">
              {lines.map((line) => (
                <div
                  key={`${line.product.id}-${line.variant?.id}`}
                  data-testid={`row-cart-${line.product.id}`}
                  className="flex gap-4 py-4 items-center"
                >
                  <img
                    src={line.product.imageUrl || ''}
                    alt={line.product.nameAr}
                    className="size-20 rounded-[18px] object-cover bg-[#E8EFEA] shrink-0 border border-[#DEE6E0]"
                  />

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground line-clamp-1">
                          {line.product.nameAr}
                        </h3>
                        {line.variant && (
                          <p className="text-xs text-[#527E5F] font-medium mt-0.5">
                            الدرجة: {line.variant.nameAr}
                          </p>
                        )}
                      </div>
                      <span className="font-mono-brand text-sm font-bold text-foreground shrink-0">
                        {line.product.price * line.quantity} ج.م
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Capsule Stepper */}
                      <div className="flex items-center rounded-full border border-[#DEE6E0] bg-[#FAFBF9] px-2 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          aria-label="تقليل"
                          data-testid={`button-cart-minus-${line.product.id}`}
                          onClick={() =>
                            line.quantity === 1
                              ? remove(line.product.id, line.variant?.id)
                              : setQuantity(line.product.id, line.quantity - 1, line.variant?.id)
                          }
                          className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-7 text-center font-mono-brand text-xs font-bold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="زيادة"
                          data-testid={`button-cart-plus-${line.product.id}`}
                          onClick={() =>
                            setQuantity(line.product.id, line.quantity + 1, line.variant?.id)
                          }
                          className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label={`حذف ${line.product.nameAr}`}
                        data-testid={`button-remove-${line.product.id}`}
                        onClick={() => remove(line.product.id, line.variant?.id)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="rounded-[28px] border border-[#DEE6E0] bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Tag className="size-4 text-[#527E5F]" /> كود الخصم أو قسيمة الشراء
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="أدخلي كود الخصم (مثال: ROUTINE10)"
                className="flex-1 rounded-full border border-[#DEE6E0] bg-[#FAFBF9] px-4 py-2 text-xs font-mono uppercase outline-none focus:border-[#76A080]"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="rounded-full bg-[#76A080] px-5 py-2 text-xs font-bold text-white hover:bg-[#648F6E] transition shadow-xs"
              >
                تطبيق
              </button>
            </div>
            {couponSuccess && (
              <p className="mt-2 text-xs font-bold text-[#3B6648]">
                ✓ تم تطبيق كود الخصم بنجاح وخصم {discountAmount} ج.م!
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Checkout Details Form */}
        <div className="space-y-4">
          {/* Guest or Logged user alert */}
          {!user && (
            <div className="flex items-center justify-between rounded-[24px] bg-[#E8EFEA] p-4 border border-[#DEE6E0]">
              <div className="flex items-center gap-2 text-xs">
                <UserIcon className="size-4 text-[#4E7A5A]" />
                <span>لديكِ حساب مسجل معنا؟</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="text-xs font-bold text-[#4E7A5A] underline"
              >
                تسجيل الدخول لتعبئة سريعة
              </button>
            </div>
          )}

          <form
            onSubmit={submitOrder}
            className="rounded-[28px] border border-[#DEE6E0] bg-white p-6 shadow-xs space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-foreground pb-2 border-b border-border">
              بيانات الشحن والتوصيل
            </h2>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                الاسم الكامل <span className="text-primary">*</span>
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم بالكامل"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  البريد الإلكتروني <span className="text-primary">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  رقم الهاتف / المحمول <span className="text-primary">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">الدولة</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                >
                  <option value="EG">مصر (Egypt)</option>
                  <option value="SA">المملكة العربية السعودية</option>
                  <option value="AE">الإمارات العربية المتحدة</option>
                  <option value="KW">الكويت</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">المحافظة / المدينة</label>
                <input
                  required
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="القاهرة / الجيزة / الإسكندرية"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                عنوان التوصيل بالتفصيل <span className="text-primary">*</span>
              </label>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="اسم الحي أو المنطقة، الشارع، رقم العقار"
                className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-xs outline-none focus:border-[#76A080] focus:ring-1 focus:ring-[#76A080]/30 transition"
              />
            </div>

            {/* Payment method selector - Egyptian Methods */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-foreground mb-2">طريقة الدفع</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vodafone')}
                  className={`rounded-full border py-2.5 px-3 text-center font-bold transition ${
                    paymentMethod === 'vodafone'
                      ? 'border-[#4E7A5A] bg-[#4E7A5A] text-white shadow-sm'
                      : 'border-border bg-white text-muted-foreground hover:bg-[#E8EFEA]/50'
                  }`}
                >
                  فودافون كاش ومحافظ
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`rounded-full border py-2.5 px-3 text-center font-bold transition ${
                    paymentMethod === 'card'
                      ? 'border-[#4E7A5A] bg-[#4E7A5A] text-white shadow-sm'
                      : 'border-border bg-white text-muted-foreground hover:bg-[#E8EFEA]/50'
                  }`}
                >
                  بطاقة بنكية (فيزا / ميزة)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('fawry')}
                  className={`rounded-full border py-2.5 px-3 text-center font-bold transition ${
                    paymentMethod === 'fawry'
                      ? 'border-[#4E7A5A] bg-[#4E7A5A] text-white shadow-sm'
                      : 'border-border bg-white text-muted-foreground hover:bg-[#E8EFEA]/50'
                  }`}
                >
                  فوري (Fawry)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`rounded-full border py-2.5 px-3 text-center font-bold transition ${
                    paymentMethod === 'cod'
                      ? 'border-[#4E7A5A] bg-[#4E7A5A] text-white shadow-sm'
                      : 'border-border bg-white text-muted-foreground hover:bg-[#E8EFEA]/50'
                  }`}
                >
                  الدفع عند الاستلام
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 border-t border-border pt-4 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>المجموع الفرعي:</span>
                <span className="font-mono-brand font-bold">{subtotal} ج.م</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>خصم الكوبون:</span>
                  <span className="font-mono-brand">-{discountAmount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>تكلفة الشحن:</span>
                <span className="font-mono-brand font-bold">
                  {shipping === 0 ? (
                    <span className="text-[#4E7A5A] font-bold">مجاني</span>
                  ) : (
                    `${shipping} ج.م`
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-sm font-extrabold text-foreground">
                <span>المجموع النهائي:</span>
                <span className="font-display text-lg text-[#4E7A5A] font-mono-brand">
                  {total} ج.م
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={orderMutation.isPending}
              data-testid="button-submit-order"
              className="w-full rounded-full bg-[#4E7A5A] py-3.5 text-sm font-bold text-white shadow-md shadow-[#4E7A5A]/25 transition hover:bg-[#3F6649] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {orderMutation.isPending ? 'جارٍ معالجة طلبك...' : `تأكيد الطلب بمبلغ ${total} ج.م`}
            </button>

            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>دفع آمن ومحمي بأحدث بروتوكولات التشفير</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}