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
  Smartphone,
  MessageCircle,
  MapPin,
  Edit3,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { useLuxuryLoader } from '@/components/luxury-loader';
import { notifyTelegramNewOrder } from '@/lib/telegram';
import { uploadOrderToSupabase, supabase } from '@/lib/supabase';
import {
  GOVERNORATES,
  MIN_ORDER_AMOUNT,
  FREE_SHIPPING_THRESHOLD,
  getShippingRate,
  getGovernorate,
  getDistricts,
} from '@/lib/shipping';

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { lines, subtotal, setQuantity, remove, clear } = useCart();
  const {
    user,
    isAuthenticated,
    setAuthModalOpen,
    login,
    register,
    loginWithGoogle,
    addAddress,
    updateUserPoints,
  } = useAuth();
  const { t, isAr, formatPrice, dir } = useLanguage();
  const { showLoader } = useLuxuryLoader();

  // 3-Step Checkout Flow: 'shipping' -> 'auth' (if guest) -> 'payment'
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'auth' | 'payment'>('shipping');

  const DRAFT_CACHE_KEY = 'roma_shipping_draft';

  // Customer shipping fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [altPhone, setAltPhone] = useState('');
  const [governorate, setGovernorate] = useState('cairo');
  const [district, setDistrict] = useState(getDistricts('cairo')[0] || '');
  const [address, setAddress] = useState(user?.savedAddresses?.[0] || '');
  const [notes, setNotes] = useState('');

  // Inline Auth Form State (embedded directly in page without modals)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Egyptian digital payment methods (InstaPay & Vodafone Cash)
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay'>('instapay');

  // Specific inputs for local payments
  const [vodafoneSenderNumber, setVodafoneSenderNumber] = useState('');
  const [instapayReference, setInstapayReference] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState(false);

  // Minimum Order Calculation (200 EGP)
  const isMinOrderReached = subtotal >= MIN_ORDER_AMOUNT;
  const remainingForMinOrder = Math.max(0, MIN_ORDER_AMOUNT - subtotal);
  const minOrderProgress = Math.min(100, Math.round((subtotal / MIN_ORDER_AMOUNT) * 100));

  // Dynamic Governorate Shipping & Free Shipping on 500+ EGP
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const rawShippingCost = getShippingRate(governorate);
  const shippingCost = isFreeShipping ? 0 : rawShippingCost;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const selectedGov = getGovernorate(governorate);

  const [complete, setComplete] = useState<{
    id: string;
    total: number;
    method: string;
    customerPhone?: string;
    customerName?: string;
    fullAddress?: string;
    isFreeShip?: boolean;
    shippingAmt?: number;
    waUrl?: string;
  } | null>(null);

  // 1. Load cached shipping draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_CACHE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.name) setName(draft.name);
        if (draft.phone) setPhone(draft.phone);
        if (draft.altPhone) setAltPhone(draft.altPhone);
        if (draft.governorate) {
          setGovernorate(draft.governorate);
          const dists = getDistricts(draft.governorate);
          if (draft.district && dists.includes(draft.district)) {
            setDistrict(draft.district);
          } else {
            setDistrict(dists[0] || '');
          }
        }
        if (draft.address) setAddress(draft.address);
        if (draft.notes) setNotes(draft.notes);
      }
    } catch (_) {}
  }, []);

  // 2. Sync user profile info & auto-advance when authenticated
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (!address && user.savedAddresses?.[0]) setAddress(user.savedAddresses[0]);
    }
    // If user was on auth step and is now authenticated, auto-advance to payment step
    if (isAuthenticated && checkoutStep === 'auth') {
      setCheckoutStep('payment');
    }
  }, [user, isAuthenticated, checkoutStep]);

  // 3. Keep inline auth fields pre-filled from shipping inputs
  useEffect(() => {
    if (name && !authName) setAuthName(name);
    if (phone && !authPhone) setAuthPhone(phone);
    if (email && !authEmail) setAuthEmail(email);
  }, [name, phone, email]);

  const handleGovernorateChange = (newGovId: string) => {
    setGovernorate(newGovId);
    const dists = getDistricts(newGovId);
    setDistrict(dists[0] || '');
  };

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

  // Shipping form validation logic
  const validateShippingData = (): boolean => {
    setValidationError('');

    // Minimum Order Amount Validation (200 EGP)
    if (subtotal < MIN_ORDER_AMOUNT) {
      setValidationError(
        isAr
          ? `عذراً، الحد الأدنى للطلب هو ${MIN_ORDER_AMOUNT} ج.م. يرجى إضافة منتجات إضافية بقيمة ${remainingForMinOrder} ج.م لتأكيد طلبكِ.`
          : `Minimum order amount is ${MIN_ORDER_AMOUNT} EGP. Please add ${remainingForMinOrder} EGP more to proceed.`
      );
      return false;
    }

    // 1. Full name validation:
    // - Must consist of at least two names (first & last)
    // - Letters only, no numbers or symbols
    const trimmedName = name.trim();
    const nameWords = trimmedName.split(/\s+/).filter(Boolean);
    if (nameWords.length < 2) {
      setValidationError(
        isAr
          ? 'يرجى إدخال الاسم بالكامل (الاسم الثنائي على الأقل مثل: سارة أحمد)'
          : 'Please enter your full name (at least two names)'
      );
      return false;
    }
    const validNameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!validNameRegex.test(trimmedName)) {
      setValidationError(
        isAr
          ? 'الاسم يجب أن يتكون من أحرف فقط وبدون أي أرقام أو رموز.'
          : 'Name must contain letters only, without numbers or symbols.'
      );
      return false;
    }

    // 2. Primary Mobile Phone validation:
    // Exactly 11 digits, starts with 010, 011, 012, or 015, numbers only
    const cleanPhone = phone.replace(/\D/g, '');
    const validEgyptianPhoneRegex = /^(010|011|012|015)\d{8}$/;
    if (!validEgyptianPhoneRegex.test(cleanPhone)) {
      setValidationError(
        isAr
          ? 'رقم الهاتف المحمول غير صحيح. يجب أن يتكون من 11 رقماً ويبدأ بـ (010 أو 011 أو 012 أو 015).'
          : 'Invalid mobile phone. Must be 11 digits starting with 010, 011, 012, or 015.'
      );
      return false;
    }

    // 3. Alternative Phone validation:
    // Optional, but if provided must NOT match primary and must be valid 11 digits
    const cleanAltPhone = altPhone.replace(/\D/g, '');
    if (cleanAltPhone) {
      if (cleanAltPhone === cleanPhone) {
        setValidationError(
          isAr
            ? 'رقم الهاتف البديل يجب أن يكون مختلفاً عن رقم الهاتف الأساسي.'
            : 'Alternative phone number must not match primary phone number.'
        );
        return false;
      }
      if (!validEgyptianPhoneRegex.test(cleanAltPhone)) {
        setValidationError(
          isAr
            ? 'رقم الهاتف البديل غير صحيح. يجب أن يتكون من 11 رقماً ويبدأ بـ (010 أو 011 أو 012 أو 015).'
            : 'Alternative phone number must be 11 digits starting with 010, 011, 012, or 015.'
        );
        return false;
      }
    }

    // 4. Governorate & District:
    if (!governorate) {
      setValidationError(isAr ? 'يرجى اختيار المحافظة' : 'Please select governorate');
      return false;
    }
    if (!district) {
      setValidationError(isAr ? 'يرجى اختيار المركز أو الحي' : 'Please select district/center');
      return false;
    }

    // 5. Detailed Address validation:
    // Must contain letters, numbers, and spaces only (NO special symbols)
    const trimmedAddress = address.trim();
    if (!trimmedAddress || trimmedAddress.length < 5) {
      setValidationError(
        isAr
          ? 'يرجى كتابة العنوان بالتفصيل (اسم الشارع ورقم المبنى والشقة).'
          : 'Please enter detailed address (street, building, apartment).'
      );
      return false;
    }
    const validAddressRegex = /^[\u0600-\u06FFa-zA-Z0-9\s]+$/;
    if (!validAddressRegex.test(trimmedAddress)) {
      setValidationError(
        isAr
          ? 'العنوان التفصيلي يجب أن يحتوي على أحرف وأرقام ومسافات فقط دون أي رموز خاصة.'
          : 'Detailed address must contain letters and numbers only without special symbols.'
      );
      return false;
    }

    // Cache valid shipping draft in localStorage
    try {
      localStorage.setItem(
        DRAFT_CACHE_KEY,
        JSON.stringify({
          name: trimmedName,
          phone: cleanPhone,
          altPhone: cleanAltPhone,
          governorate,
          district,
          address: trimmedAddress,
          notes: notes.trim(),
        })
      );
    } catch (_) {}

    return true;
  };

  // Handler for Proceed button in Step 1 (Shipping)
  const handleProceedFromShipping = () => {
    if (!validateShippingData()) return;

    if (!isAuthenticated) {
      setCheckoutStep('auth');
    } else {
      setCheckoutStep('payment');
    }
  };

  // Inline Auth handlers (Login, Register, Google OAuth)
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setAuthError(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    const res = await login(authEmail.trim(), authPassword);
    setAuthLoading(false);
    if (!res.success) {
      setAuthError(res.error || (isAr ? 'فشل تسجيل الدخول، تأكد من صحة البيانات' : 'Login failed, check credentials'));
    } else {
      setCheckoutStep('payment');
    }
  };

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const regName = authName.trim() || name.trim();
    const regPhone = authPhone.trim() || phone.trim();
    if (!regName || !authEmail.trim() || !authPassword) {
      setAuthError(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    const res = await register(regName, authEmail.trim(), regPhone, authPassword);
    setAuthLoading(false);
    if (!res.success) {
      setAuthError(res.error || (isAr ? 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى' : 'Registration failed, try again'));
    } else {
      setCheckoutStep('payment');
    }
  };

  const handleInlineGoogle = async () => {
    setAuthLoading(true);
    setAuthError('');
    // Save draft in cache before navigating to Google
    validateShippingData();
    const res = await loginWithGoogle(`${window.location.origin}/cart`);
    setAuthLoading(false);
    if (!res.success && res.error) {
      setAuthError(res.error);
    }
  };

  const handleInlineDemo = async () => {
    setAuthLoading(true);
    setAuthError('');
    const res = await login('noura@roma-eg.my', 'Password123!');
    setAuthLoading(false);
    if (res.success) {
      setCheckoutStep('payment');
    }
  };

  // Submit Order (Executed in Payment Step)
  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!validateShippingData()) {
      setCheckoutStep('shipping');
      return;
    }

    if (!isAuthenticated || !user) {
      setCheckoutStep('auth');
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
    showLoader(isAr ? 'جاري تأكيد ومعالجة طلبك الفاخر...' : 'Processing your royal order...', 600);

    const fallbackId = String(Math.floor(100000 + Math.random() * 900000));
    const selectedGov = GOVERNORATES.find((g) => g.id === governorate);
    const govName = isAr ? selectedGov?.nameAr : (selectedGov?.nameEn || 'Cairo');
    const fullAddress = `${address.trim()} - حي ${district} - ${govName} (مصر)`;

    const paymentLabel =
      paymentMethod === 'vodafone_cash'
        ? (isAr ? 'فودافون كاش / المحافظ الإلكترونية' : 'Vodafone Cash')
        : (isAr ? 'إنستاباي (InstaPay)' : 'InstaPay');

    const paymentRef =
      paymentMethod === 'vodafone_cash'
        ? `رقم المحول: ${vodafoneSenderNumber}`
        : `مرجع إنستاباي: ${instapayReference}`;

    const orderPayload = {
      orderId: fallbackId,
      orderNumber: `ROMA-${fallbackId}`,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      shippingAddress: fullAddress,
      paymentMethod: paymentLabel,
      paymentStatus: 'verified',
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
      // 1. Upload to Supabase database (matching real table columns)
      let resolvedOrderId: string = fallbackId;
      try {
        const fullAddressWithGov = `${govName} - ${fullAddress}${notes ? ` (ملاحظات: ${notes.trim()})` : ''}`;
        const orderItemsPayload = lines.map((l) => ({
          product_id: l.product.id,
          name: isAr ? l.product.nameAr : (l.product.nameEn || l.product.nameAr),
          price: Number(l.product.price) || 0,
          quantity: Number(l.quantity) || 1,
          variant: isAr ? l.variant?.nameAr : (l.variant?.nameEn || l.variant?.nameAr || null),
          image: l.product.imageUrl || '',
          payment_method: paymentMethod,
          shipping_cost: shippingCost,
          coupon: couponSuccess ? couponCode.trim().toUpperCase() : null,
          discount: discountAmount,
        }));

        const { data: newOrder, error: sbError } = await supabase
          .from('orders')
          .insert({
            order_number: `ROMA-${fallbackId}`,
            user_id: user?.id || null,
            customer_name: name.trim(),
            phone: phone.trim(),
            shipping_address: fullAddressWithGov,
            total_amount: total,
            status: 'pending',
            items: orderItemsPayload,
          })
          .select()
          .single();

        if (!sbError && newOrder?.id) {
          resolvedOrderId = String(newOrder.id);
          orderPayload.orderId = resolvedOrderId;
          orderPayload.orderNumber = newOrder.order_number || `ROMA-${resolvedOrderId.slice(0, 8).toUpperCase()}`;
        } else if (sbError) {
          console.warn('Supabase order upload notice:', sbError.message);
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
          .then(null, () => {});
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

      // 6. Build customer WhatsApp confirmation message & URL
      const waCustomerPhone = cleanPhone.startsWith('0')
        ? `2${cleanPhone}`
        : cleanPhone.startsWith('2')
        ? cleanPhone
        : `20${cleanPhone}`;

      const itemsSummaryList = lines
        .map(
          (l) =>
            `• ${l.quantity}x ${isAr ? l.product.nameAr : (l.product.nameEn || l.product.nameAr)}${
              l.variant ? ` (${isAr ? l.variant.nameAr : l.variant.nameEn})` : ''
            } — ${formatPrice(l.product.price * l.quantity)}`
        )
        .join('\n');

      const customerWhatsAppMsg = isAr
        ? `👑 مرحباً أستاذ/ة ${name.trim()} ✨\n` +
          `تم تسجيل وتأكيد طلبكِ بنجاح من متجر ROMA للجمال ومستحضرات العناية الفاخرة 🌸\n\n` +
          `🔖 رقم الطلب: #ROMA-${resolvedOrderId}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📦 محتويات الطلب:\n${itemsSummaryList}\n\n` +
          `🚚 مصاريف الشحن: ${isFreeShipping ? 'شحن مجاني (عرض 500 ج.م) 🎁' : formatPrice(shippingCost)}\n` +
          `💰 الإجمالي النهائي: ${formatPrice(total)}\n` +
          `📍 عنوان التوصيل: ${fullAddress}\n` +
          `💳 طريقة الدفع: ${paymentLabel}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `💖 شكراً لتسوقكِ معنا! يتم تجهيز شحنتكِ بعناية والتوصيل لباب منزلكِ قريباً.`
        : `👑 Hello ${name.trim()} ✨\n` +
          `Your royal order has been recorded at ROMA! 🌸\n\n` +
          `🔖 Order Number: #ROMA-${resolvedOrderId}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📦 Items:\n${itemsSummaryList}\n\n` +
          `🚚 Shipping: ${isFreeShipping ? 'FREE Shipping 🎁' : formatPrice(shippingCost)}\n` +
          `💰 Total Amount: ${formatPrice(total)}\n` +
          `📍 Delivery Address: ${fullAddress}\n` +
          `💳 Payment Method: ${paymentLabel}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `Thank you for shopping with ROMA Cosmetics & Jewelry!`;

      const customerWaUrl = `https://wa.me/${waCustomerPhone}?text=${encodeURIComponent(customerWhatsAppMsg)}`;

      try {
        window.open(customerWaUrl, '_blank');
      } catch (_) {}

      // 7. Complete view & clear cart & redirect to order tracking
      setComplete({
        id: resolvedOrderId,
        total,
        method: paymentLabel,
        customerPhone: phone.trim(),
        customerName: name.trim(),
        fullAddress,
        isFreeShip: isFreeShipping,
        shippingAmt: shippingCost,
        waUrl: customerWaUrl,
      });
      clear();
      try {
        localStorage.removeItem(DRAFT_CACHE_KEY);
      } catch (_) {}

      // Redirect customer to real-time order tracking in /account
      showLoader(
        isAr ? 'تم تأكيد طلبكِ بنجاح! جاري الانتقال لصفحة تتبع الطلب...' : 'Order confirmed! Redirecting to tracking...',
        1000
      );
      setTimeout(() => {
        setLocation('/account');
      }, 800);
    } catch (criticalErr) {
      console.error('Submit order caught error:', criticalErr);
      const waCustomerPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : `20${cleanPhone}`;
      const customerWaUrl = `https://wa.me/${waCustomerPhone}?text=${encodeURIComponent(
        `مرحباً أستاذ/ة ${name.trim()}، تم تسجيل طلبكِ رقم #ROMA-${fallbackId} بنجاح في متجر روما بمبلغ ${formatPrice(total)}.`
      )}`;
      setComplete({
        id: fallbackId,
        total,
        method: paymentLabel,
        customerPhone: phone.trim(),
        customerName: name.trim(),
        fullAddress,
        isFreeShip: isFreeShipping,
        shippingAmt: shippingCost,
        waUrl: customerWaUrl,
      });
      clear();
      try {
        localStorage.removeItem(DRAFT_CACHE_KEY);
      } catch (_) {}

      setTimeout(() => {
        setLocation('/account');
      }, 800);
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

          {/* Direct Customer WhatsApp Invoice Dispatch */}
          {complete.waUrl && (
            <a
              href={complete.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 px-6 text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition active:scale-[0.99]"
            >
              <MessageCircle className="size-4 shrink-0" />
              <span>
                {isAr
                  ? `إرسال تفاصيل الفاتورة إلى واتساب (${complete.customerPhone || phone}) 💬`
                  : `Send Invoice to Customer WhatsApp (${complete.customerPhone || phone}) 💬`}
              </span>
            </a>
          )}

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
            href={`https://wa.me/201505566849?text=${encodeURIComponent(
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
    <div className="roma-container pt-4 pb-28 md:py-14 text-white" dir={dir}>
      {/* Top Free Shipping Progress Indicator */}
      {/* Top Minimum Order & Free Shipping Banner */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-[#141414] p-4 md:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
          <div className="flex items-center gap-2 text-white">
            {!isMinOrderReached ? (
              <AlertCircle className="size-4 text-amber-400 shrink-0" />
            ) : (
              <Check className="size-4 text-emerald-400 shrink-0" />
            )}
            <span>
              {!isMinOrderReached
                ? isAr
                  ? `الحد الأدنى للطلب هو ${MIN_ORDER_AMOUNT} ج.م — أضيفي بقيمة ${remainingForMinOrder} ج.م إضافية لتأكيد الشراء`
                  : `Minimum order amount is ${MIN_ORDER_AMOUNT} EGP — Add ${remainingForMinOrder} EGP more to proceed`
                : isAr
                ? `✨ تم استيفاء الحد الأدنى للطلب (${MIN_ORDER_AMOUNT} ج.م) بنجاح`
                : `✨ Minimum order requirement (${MIN_ORDER_AMOUNT} EGP) met!`}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!isMinOrderReached && (
              <Link
                href="/shop"
                className="text-[11px] font-semibold text-[#D4A5A5] hover:underline"
              >
                {isAr ? 'تصفح المنتجات ←' : 'Browse items →'}
              </Link>
            )}
            <span className="font-mono-brand text-[#D4A5A5]">{minOrderProgress}%</span>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-[#1A1A1A] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isMinOrderReached
                ? 'bg-gradient-to-r from-[#D4A5A5] to-emerald-400'
                : 'bg-gradient-to-r from-rose-500 via-amber-400 to-[#D4A5A5]'
            }`}
            style={{ width: `${minOrderProgress}%` }}
          />
        </div>

        {/* Free Shipping 500 EGP Threshold Alert */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-[#D4A5A5] shrink-0" />
            <span className="text-white font-medium">
              {isFreeShipping
                ? isAr
                  ? '🎁 تهانينا! طلبكِ يتضمن شحناً مجانياً بالكامل لكافة محافظات مصر (عرض الطلبات فوق 500 ج.م)'
                  : '🎁 Congratulations! You unlocked FREE shipping across Egypt (500+ EGP offer)'
                : isAr
                ? `🚚 أضيفي بقيمة ${formatPrice(remainingForFreeShipping)} إضافية للحصول على شحن مجاني بالكامل!`
                : `🚚 Add ${formatPrice(remainingForFreeShipping)} more to enjoy 100% FREE shipping!`}
            </span>
          </div>
          {isFreeShipping ? (
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-500/20">
              {isAr ? 'شحن مجاني مفعل ✨' : 'FREE Shipping Active ✨'}
            </span>
          ) : (
            <Link href="/shop" className="text-[11px] text-[#D4A5A5] hover:underline shrink-0 font-semibold">
              {isAr ? 'أضيفي منتجات +' : 'Add Items +'}
            </Link>
          )}
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
                    className="size-20 rounded-2xl object-contain bg-[#161616] shrink-0 border border-white/10 p-1.5"
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

              <div className="flex justify-between items-center text-[#A1A1AA]">
                <span>
                  {isAr ? 'رسوم الشحن والتوصيل:' : 'Express Shipping:'}
                  {selectedGov && (
                    <span className="text-[11px] text-[#D4A5A5] ms-1">
                      ({isAr ? selectedGov.nameAr : selectedGov.nameEn})
                    </span>
                  )}
                </span>
                <span className="font-mono-brand font-bold">
                  {isFreeShipping ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-xs font-bold">
                      <Sparkles className="size-3 text-emerald-400" />
                      {isAr ? 'شحن مجاني ✨' : 'FREE Shipping ✨'}
                    </span>
                  ) : (
                    <span className="text-white">{formatPrice(shippingCost)}</span>
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

        {/* Right Column: 3-Step Checkout Flow */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 md:p-8 shadow-xl space-y-6">
            {/* Step Progress Stepper Bar */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              {/* Step 1: Shipping */}
              <button
                type="button"
                onClick={() => setCheckoutStep('shipping')}
                className="flex items-center gap-2 text-right group transition cursor-pointer"
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    checkoutStep === 'shipping'
                      ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {checkoutStep !== 'shipping' ? <Check className="size-4" /> : '1'}
                </div>
                <div>
                  <span
                    className={`text-xs font-bold block transition ${
                      checkoutStep === 'shipping' ? 'text-white' : 'text-[#A1A1AA] group-hover:text-white'
                    }`}
                  >
                    {isAr ? 'بيانات الشحن' : 'Shipping Info'}
                  </span>
                  <span className="text-[10px] text-[#A1A1AA] block">
                    {isAr ? 'المحافظة والعنوان' : 'Address'}
                  </span>
                </div>
              </button>

              <div className="h-0.5 w-6 sm:w-12 bg-white/10" />

              {/* Step 2: Account / Auth */}
              <div className="flex items-center gap-2 text-right">
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    checkoutStep === 'auth'
                      ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20'
                      : isAuthenticated
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#1A1A1A] text-[#A1A1AA] border border-white/10'
                  }`}
                >
                  {isAuthenticated ? <Check className="size-4" /> : '2'}
                </div>
                <div>
                  <span
                    className={`text-xs font-bold block transition ${
                      checkoutStep === 'auth' ? 'text-white' : 'text-[#A1A1AA]'
                    }`}
                  >
                    {isAr ? 'الحساب والتسجيل' : 'Account'}
                  </span>
                  <span className="text-[10px] text-[#A1A1AA] block">
                    {isAuthenticated ? (isAr ? 'مسجل الدخول ✓' : 'Signed in') : (isAr ? 'إلزامي للطلب' : 'Required')}
                  </span>
                </div>
              </div>

              <div className="h-0.5 w-6 sm:w-12 bg-white/10" />

              {/* Step 3: Payment */}
              <div className="flex items-center gap-2 text-right">
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    checkoutStep === 'payment'
                      ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20'
                      : 'bg-[#1A1A1A] text-[#A1A1AA] border border-white/10'
                  }`}
                >
                  3
                </div>
                <div>
                  <span
                    className={`text-xs font-bold block transition ${
                      checkoutStep === 'payment' ? 'text-white' : 'text-[#A1A1AA]'
                    }`}
                  >
                    {isAr ? 'طريقة الدفع' : 'Payment'}
                  </span>
                  <span className="text-[10px] text-[#A1A1AA] block">
                    {isAr ? 'إنستاباي وفودافون' : 'InstaPay & Voda'}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="rounded-2xl bg-red-950/50 border border-red-800/50 p-3.5 text-xs text-red-300 flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="size-4 text-red-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: SHIPPING INFORMATION FORM                                         */}
            {/* ========================================================================= */}
            {checkoutStep === 'shipping' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg md:text-xl font-bold font-display text-white flex items-center gap-2">
                    <Truck className="size-5 text-[#D4A5A5]" />
                    <span>{isAr ? 'بيانات الشحن والتوصيل (مصر)' : 'Shipping & Delivery (Egypt)'}</span>
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    {isAr
                      ? 'توصيل فوري لباب المنزل خلال 24 - 48 ساعة لجميع المحافظات المصرية.'
                      : 'Fast doorstep delivery across all Egyptian governorates.'}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name & Phone */}
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
                        placeholder={isAr ? 'اسم المستلم (الاسم الثنائي على الأقل)...' : 'Full recipient name...'}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                        {isAr ? 'رقم الهاتف المحمول' : 'Mobile Phone'} *
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={11}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        placeholder="010XXXXXXXX"
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  {/* Governorate & District Dropdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                        {isAr ? 'المحافظة' : 'Governorate'} *
                      </label>
                      <select
                        value={governorate}
                        onChange={(e) => handleGovernorateChange(e.target.value)}
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
                        {isAr ? 'المركز / الحي' : 'District / Center'} *
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white outline-none focus:border-[#D4A5A5]"
                      >
                        {getDistricts(governorate).map((dist) => (
                          <option key={dist} value={dist} className="bg-[#141414] text-white">
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Alt Phone */}
                  <div>
                    <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                      {isAr ? 'رقم هاتف بديل (اختياري)' : 'Alternative Phone (Optional)'}
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono tracking-wider"
                    />
                  </div>

                  {/* Detailed Address */}
                  <div>
                    <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                      {isAr ? 'العنوان بالتفصيل' : 'Detailed Address'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={
                        isAr
                          ? 'اسم الشارع، رقم العمارة، رقم الدور، الشقة'
                          : 'Street name, building number, floor, apt'
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                    />
                    <div className="flex items-center gap-1.5 text-[11px] text-[#D4A5A5] mt-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      <span>
                        {isAr
                          ? `المحافظة: ${selectedGov?.nameAr || 'القاهرة'} | المركز / الحي: ${district} (أحرف وأرقام بدون رموز)`
                          : `Gov: ${selectedGov?.nameEn || 'Cairo'} | District: ${district} (Letters & digits only)`}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Notes */}
                  <div>
                    <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                      {isAr ? 'ملاحظات خاصة للمندوب (اختياري)' : 'Delivery Notes (Optional)'}
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

                {/* Proceed Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedFromShipping}
                    disabled={!isMinOrderReached}
                    className={`flex items-center justify-center gap-2 w-full rounded-2xl py-4 px-6 text-sm font-bold shadow-lg transition active:scale-[0.99] ${
                      !isMinOrderReached
                        ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-white/10 opacity-70'
                        : 'bg-[#D4A5A5] hover:bg-[#C89595] text-[#0A0A0A] shadow-[#D4A5A5]/25 cursor-pointer'
                    }`}
                  >
                    {!isMinOrderReached ? (
                      <>
                        <AlertCircle className="size-4 text-amber-400" />
                        <span>
                          {isAr
                            ? `الحد الأدنى للطلب 200 ج.م (متبقي ${formatPrice(remainingForMinOrder)})`
                            : `Minimum Order 200 EGP (${formatPrice(remainingForMinOrder)} left)`}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{isAr ? 'متابعة إتمام الطلب ✨' : 'Proceed to Checkout ✨'}</span>
                        <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                      </>
                    )}
                  </button>

                  {!isMinOrderReached && (
                    <div className="mt-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-center text-xs text-amber-300 flex items-center justify-center gap-1.5">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>
                        {isAr
                          ? `الحد الأدنى لإتمام الطلب هو 200 ج.م، يرجى إضافة منتجات بقيمة ${formatPrice(remainingForMinOrder)} إضافية لتفعيل الطلب.`
                          : `Minimum order amount is 200 EGP. Please add ${formatPrice(remainingForMinOrder)} more to checkout.`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: INLINE AUTHENTICATION SECTION (No Popups!)                        */}
            {/* ========================================================================= */}
            {checkoutStep === 'auth' && !isAuthenticated && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center space-y-1">
                  <div className="size-12 rounded-2xl bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 text-[#D4A5A5] flex items-center justify-center mx-auto mb-2">
                    <Lock className="size-6" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold font-display text-white">
                    {isAr ? 'تسجيل الدخول أو إنشاء حساب' : 'Sign In or Register'}
                  </h2>
                  <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
                    {isAr
                      ? `تم حفظ بيانات الشحن بنجاح لـ (${name}). يُشترط تسجيل الدخول لحماية وتتبع طلبكِ وتجميع نقاط المكافآت.`
                      : `Shipping details saved for (${name}). Please sign in to secure and track your order.`}
                  </p>
                </div>

                {authError && (
                  <div className="rounded-2xl bg-red-950/50 border border-red-800/50 p-3 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="size-4 text-red-400 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Google 1-Click Login (Redirects back to /cart) */}
                <button
                  type="button"
                  onClick={handleInlineGoogle}
                  disabled={authLoading}
                  className="flex items-center justify-center gap-3 w-full rounded-2xl border border-white/10 bg-[#1A1A1A] hover:bg-white/5 py-3 px-4 text-xs md:text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isAr ? 'متابعة سريعة عبر حساب Google' : 'Continue with Google'}</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[11px] text-[#A1A1AA] uppercase font-medium">
                    {isAr ? 'أو بالبريد الإلكتروني' : 'or with email'}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Tabs: Login / Register */}
                <div className="flex rounded-2xl bg-[#1A1A1A] p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError('');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      authTab === 'login' ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md' : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {isAr ? 'تسجيل الدخول' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setAuthError('');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      authTab === 'register' ? 'bg-[#D4A5A5] text-[#0A0A0A] shadow-md' : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {isAr ? 'إنشاء حساب جديد' : 'Create Account'}
                  </button>
                </div>

                {/* Login Tab Form */}
                {authTab === 'login' ? (
                  <form onSubmit={handleInlineLogin} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                        {isAr ? 'البريد الإلكتروني' : 'Email Address'} *
                      </label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                        {isAr ? 'كلمة المرور' : 'Password'} *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] pe-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-3 flex items-center text-[#A1A1AA] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-2xl bg-[#D4A5A5] hover:bg-[#C89595] py-3.5 text-xs md:text-sm font-bold text-[#0A0A0A] shadow-md transition disabled:opacity-60 cursor-pointer"
                    >
                      {authLoading
                        ? isAr
                          ? 'جاري التحقق...'
                          : 'Signing in...'
                        : isAr
                        ? 'تسجيل الدخول والمتابعة للدفع 🔒'
                        : 'Sign In & Continue to Payment 🔒'}
                    </button>
                  </form>
                ) : (
                  /* Register Tab Form */
                  <form onSubmit={handleInlineRegister} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                        {isAr ? 'الاسم بالكامل' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder={isAr ? 'اسمكِ الكريم...' : 'Your full name...'}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                          {isAr ? 'البريد الإلكتروني' : 'Email Address'} *
                        </label>
                        <input
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                          {isAr ? 'رقم الهاتف' : 'Phone'} *
                        </label>
                        <input
                          type="tel"
                          required
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          placeholder="010XXXXXXXX"
                          className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                        {isAr ? 'إنشاء كلمة مرور (6 أحرف على الأقل)' : 'Password (min 6 characters)'} *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] pe-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-3 flex items-center text-[#A1A1AA] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-2xl bg-[#D4A5A5] hover:bg-[#C89595] py-3.5 text-xs md:text-sm font-bold text-[#0A0A0A] shadow-md transition disabled:opacity-60 cursor-pointer"
                    >
                      {authLoading
                        ? isAr
                          ? 'جاري إنشاء الحساب...'
                          : 'Creating Account...'
                        : isAr
                        ? 'إنشاء الحساب والمتابعة للدفع ✨'
                        : 'Create Account & Continue to Payment ✨'}
                    </button>
                  </form>
                )}

                {/* Instant Demo Button for One-Click Testing */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleInlineDemo}
                    disabled={authLoading}
                    className="text-xs text-[#A1A1AA] hover:text-[#D4A5A5] transition underline underline-offset-4 cursor-pointer"
                  >
                    {isAr ? '⚡ دخول فوري بحساب تجريبي (Instant Demo)' : '⚡ Quick Instant Demo Login'}
                  </button>
                </div>

                {/* Back to Shipping Step */}
                <div className="pt-2 border-t border-white/10 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep('shipping');
                      setAuthError('');
                    }}
                    className="text-xs text-[#A1A1AA] hover:text-white transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>{isAr ? 'العودة لتعديل بيانات الشحن' : 'Back to Edit Shipping Details'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: PAYMENT METHOD & ORDER CONFIRMATION                              */}
            {/* ========================================================================= */}
            {checkoutStep === 'payment' && (
              <form onSubmit={submitOrder} className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg md:text-xl font-bold font-display text-white flex items-center gap-2">
                    <CreditCard className="size-5 text-[#D4A5A5]" />
                    <span>{isAr ? 'تأكيد الدفع وإتمام الطلب (مصر)' : 'Confirm Payment & Order'}</span>
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    {isAr
                      ? 'تم التحقق من بيانات الشحن والحساب. يُرجى اختيار طريقة التحويل المناسبة وتأكيد الطلب.'
                      : 'Verified shipping & account. Select your payment method and confirm order.'}
                  </p>
                </div>

                {/* Verified Shipping Details Summary Card */}
                <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4A5A5] flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      <span>{isAr ? 'بيانات التوصيل المعتمدة:' : 'Verified Delivery Details:'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('shipping')}
                      className="text-[11px] font-semibold text-[#A1A1AA] hover:text-white transition flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 cursor-pointer"
                    >
                      <Edit3 className="size-3" />
                      <span>{isAr ? 'تعديل' : 'Edit'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-white space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">{isAr ? 'المستلم:' : 'Recipient:'}</span>
                      <strong className="font-semibold">{name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">{isAr ? 'الموبايل:' : 'Phone:'}</span>
                      <span className="font-mono text-[#D4A5A5]">{phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">{isAr ? 'المنطقة:' : 'Area:'}</span>
                      <span>
                        {selectedGov?.nameAr || 'القاهرة'} - {district}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">{isAr ? 'العنوان:' : 'Address:'}</span>
                      <span className="text-left font-normal max-w-[65%] line-clamp-1">{address}</span>
                    </div>
                  </div>
                </div>

                {/* Egyptian Payment Method Selection */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-white block">
                    {isAr ? 'اختاري طريقة الدفع:' : 'Select Payment Method:'}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. InstaPay */}
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
                  </div>

                  {/* Dynamic Sub-Sections for Selected Egyptian Payment Method */}
                  {paymentMethod === 'vodafone_cash' && (
                    <div className="rounded-2xl border border-[#D4A5A5]/30 bg-[#1A1A1A] p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-[#A1A1AA] block">
                            {isAr ? 'رقم محفظة فودافون كاش لمتجر روما:' : 'ROMA Vodafone Cash Wallet:'}
                          </span>
                          <strong className="text-base font-bold text-[#D4A5A5] font-mono">01030920536</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('01030920536', 'voda')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 cursor-pointer"
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
                          inputMode="numeric"
                          value={vodafoneSenderNumber}
                          onChange={(e) => setVodafoneSenderNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          placeholder="010XXXXXXXX"
                          className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                          {isAr ? 'إرفاق لقطة شاشة إيصال التحويل (يتم إرسالها لبوت التلجرام):' : 'Upload Receipt Screenshot (sent to Telegram):'}
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
                      <div className="space-y-3 border-b border-white/5 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-[#A1A1AA] block">
                              {isAr ? 'يوزر إنستاباي لمتجر روما (InstaPay User):' : 'InstaPay Username:'}
                            </span>
                            <strong className="text-base font-bold text-[#D4A5A5] font-mono">sbzgx</strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('sbzgx', 'insta-user')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 cursor-pointer"
                          >
                            <Copy className="size-3.5" />
                            <span>{copiedKey === 'insta-user' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ اليوزر' : 'Copy')}</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[11px] text-[#A1A1AA] block">
                              {isAr ? 'أو التحويل برقم الموبايل (Phone):' : 'Or via Phone Number:'}
                            </span>
                            <strong className="text-base font-bold text-[#D4A5A5] font-mono">01150583501</strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('01150583501', 'insta-phone')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 cursor-pointer"
                          >
                            <Copy className="size-3.5" />
                            <span>{copiedKey === 'insta-phone' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرقم' : 'Copy')}</span>
                          </button>
                        </div>
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
                          {isAr ? 'إرفاق لقطة شاشة العملية (يتم إرسالها لبوت التلجرام مع الطلب):' : 'Upload Receipt Screenshot (sent to Telegram with order):'}
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
                </div>

                {/* Final Confirmation Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isMinOrderReached}
                    className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#D4A5A5] hover:bg-[#C89595] py-4 px-6 text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#D4A5A5]/25 transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    <Lock className="size-4" />
                    <span>
                      {isSubmitting
                        ? isAr
                          ? 'جاري تأكيد وتسجيل الطلب...'
                          : 'Processing Order...'
                        : isAr
                        ? `تأكيد الطلب الآن (${formatPrice(total)}) 🔒`
                        : `Confirm Order Now (${formatPrice(total)}) 🔒`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}