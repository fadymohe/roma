import { useState, useEffect } from 'react';
import {
  Package,
  User,
  MapPin,
  Phone,
  Sparkles,
  Clock,
  CheckCircle2,
  Truck,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  Save,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth, type UserOrder } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { supabase } from '@/lib/supabase';

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

export default function AccountPage() {
  const { user, isAuthenticated, setAuthModalOpen, logout, fetchUserOrders } = useAuth();
  const { t, isAr, formatPrice, dir } = useLanguage();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'rewards'>('orders');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('cairo');
  const [addressLine, setAddressLine] = useState(user?.savedAddresses?.[0] || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Guest order lookup state
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupOrders, setLookupOrders] = useState<any[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.savedAddresses?.[0]) setAddressLine(user.savedAddresses[0]);
    }
  }, [user]);

  // Load orders for logged in user
  useEffect(() => {
    async function loadOrders() {
      if (user) {
        setLoadingOrders(true);
        try {
          const res = await fetchUserOrders();
          setOrders(res || []);
        } catch (e) {
          console.warn('Orders fetch error:', e);
        } finally {
          setLoadingOrders(false);
        }
      } else {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccessMsg('');

    try {
      // 1. Update Supabase Auth user metadata
      await supabase.auth.updateUser({
        data: {
          name: fullName.trim(),
          phone: phone.trim(),
          city,
          savedAddresses: [addressLine.trim()],
        },
      });

      // 2. Update profiles table in public schema
      await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          city,
          address_line: addressLine.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      setProfileSuccessMsg(
        isAr ? 'تم حفظ التعديلات بنجاح في ملفك الشخصي' : 'Profile settings updated successfully'
      );
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Save profile error:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLookupOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone.trim()) return;
    setIsLookingUp(true);

    try {
      const clean = lookupPhone.trim().replace(/\D+/g, '');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('phone', `%${clean}%`)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setLookupOrders(data);
      } else {
        setLookupOrders([]);
      }
    } catch (e) {
      console.warn('Guest lookup error:', e);
    } finally {
      setIsLookingUp(false);
    }
  };

  const getStepIndex = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'delivered' || s === 'completed') return 4;
    if (s === 'shipped') return 3;
    if (s === 'confirmed' || s === 'processing') return 2;
    if (s === 'cancelled') return -1;
    return 1; // pending
  };

  const displayOrders = user ? orders : lookupOrders;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F9FAFB] pb-24 pt-6" dir={dir}>
      <div className="roma-container max-w-4xl space-y-6">
        {/* Profile Header Card */}
        <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 size-48 rounded-full bg-[#D4A5A5]/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="size-16 md:size-20 rounded-2xl border-2 border-[#D4A5A5] bg-[#1E1E1E] flex items-center justify-center p-0.5 shadow-lg shadow-[#D4A5A5]/10">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt="Profile"
                  className="h-full w-full rounded-2xl object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold font-display text-white">
                    {user?.name || (isAr ? 'حساب الزائر' : 'Guest Account')}
                  </h1>
                  <span className="rounded-full bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#D4A5A5]">
                    {user ? (isAr ? 'عضوية VIP' : 'VIP Member') : (isAr ? 'زائر' : 'Guest')}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-[#A1A1AA] mt-1 font-mono-brand">
                  {user?.email || (isAr ? 'سجلي الدخول لحفظ طلباتك وعناوينك' : 'Sign in to save orders & addresses')}
                </p>
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-[#1A1A1A] hover:bg-white/5 text-xs text-[#A1A1AA] hover:text-white transition"
                >
                  <LogOut className="size-3.5" />
                  <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A5A5] hover:bg-[#C89595] text-xs font-bold text-[#0A0A0A] shadow-md transition"
              >
                <User className="size-4" />
                <span>{isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</span>
              </button>
            )}
          </div>

          {/* Luxury Loyalty Bar */}
          <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-[#1A1A1A]/80 border border-white/5 p-3">
              <span className="text-[11px] text-[#A1A1AA] block">{isAr ? 'نقاط المكافآت' : 'Loyalty Points'}</span>
              <strong className="text-lg font-bold text-[#D4A5A5] font-mono-brand">
                {user?.points ?? 50} <span className="text-xs font-normal text-white">{isAr ? 'نقطة' : 'pts'}</span>
              </strong>
            </div>

            <div className="rounded-2xl bg-[#1A1A1A]/80 border border-white/5 p-3">
              <span className="text-[11px] text-[#A1A1AA] block">{isAr ? 'إجمالي الطلبات' : 'Total Orders'}</span>
              <strong className="text-lg font-bold text-white font-mono-brand">
                {orders.length} <span className="text-xs font-normal text-[#A1A1AA]">{isAr ? 'طلب' : 'orders'}</span>
              </strong>
            </div>

            <div className="rounded-2xl bg-[#1A1A1A]/80 border border-white/5 p-3">
              <span className="text-[11px] text-[#A1A1AA] block">{isAr ? 'الشحن المجاني' : 'Free Delivery'}</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                <Truck className="size-3.5" /> {isAr ? 'متاح فوق 500 ج' : '> 500 EGP'}
              </span>
            </div>

            <div className="rounded-2xl bg-[#1A1A1A]/80 border border-white/5 p-3">
              <span className="text-[11px] text-[#A1A1AA] block">{isAr ? 'كود الخصم الفوري' : 'VIP Code'}</span>
              <span className="text-xs font-bold font-mono text-[#D4A5A5] mt-1 block">
                ROMA10 (-10%)
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] font-bold shadow-sm'
                : 'bg-[#141414] text-[#A1A1AA] hover:text-white border border-white/5'
            }`}
          >
            <Package className="size-4" strokeWidth={1.5} />
            <span>{isAr ? 'متابعة الطلبات (My Orders)' : 'My Orders'}</span>
            {displayOrders.length > 0 && (
              <span className="size-4.5 rounded-full bg-[#0A0A0A]/20 text-[10px] flex items-center justify-center font-mono">
                {displayOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] font-bold shadow-sm'
                : 'bg-[#141414] text-[#A1A1AA] hover:text-white border border-white/5'
            }`}
          >
            <User className="size-4" strokeWidth={1.5} />
            <span>{isAr ? 'إعدادات الحساب والعنوان' : 'Profile Settings'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${
              activeTab === 'rewards'
                ? 'bg-[#D4A5A5] text-[#0A0A0A] font-bold shadow-sm'
                : 'bg-[#141414] text-[#A1A1AA] hover:text-white border border-white/5'
            }`}
          >
            <Sparkles className="size-4" strokeWidth={1.5} />
            <span>{isAr ? 'المكافآت والدفع المحلي' : 'Rewards & Egyptian Wallets'}</span>
          </button>
        </div>

        {/* TAB 1: MY ORDERS & REALTIME TRACKING STEP INDICATOR */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {!user && (
              <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Phone className="size-4 text-[#D4A5A5]" />
                  <span>{isAr ? 'تتبع طلبك برقم الهاتف المحمول (بدون تسجيل):' : 'Track Order by Mobile Number:'}</span>
                </div>
                <form onSubmit={handleLookupOrders} className="flex gap-2">
                  <input
                    type="tel"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    placeholder={isAr ? 'أدخلي رقم الهاتف المستخدم في الطلب (مثال: 010...)' : 'Enter phone used in order...'}
                    className="flex-1 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                  />
                  <button
                    type="submit"
                    disabled={isLookingUp}
                    className="rounded-xl bg-[#D4A5A5] px-5 py-2.5 text-xs font-bold text-[#0A0A0A] hover:bg-[#C89595] transition shrink-0"
                  >
                    {isLookingUp ? (isAr ? 'جاري البحث...' : 'Searching...') : (isAr ? 'بحث عن الطلب' : 'Track')}
                  </button>
                </form>
              </div>
            )}

            {loadingOrders ? (
              <div className="py-12 text-center text-[#A1A1AA] text-sm flex items-center justify-center gap-2">
                <Clock className="size-4 animate-spin text-[#D4A5A5]" />
                <span>{isAr ? 'جاري تحميل سجل الطلبات...' : 'Loading orders...'}</span>
              </div>
            ) : displayOrders.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#141414] p-12 text-center space-y-4">
                <div className="size-16 rounded-2xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center mx-auto text-[#A1A1AA]">
                  <Package className="size-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'لا توجد طلبات مسجلة حالياً' : 'No orders found'}
                </h3>
                <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                  {isAr
                    ? 'لم تقومي بأي عملية شراء بعد، تصفحي تشكيلتنا الراقية من مستحضرات التجميل والإكسسوارات الفاخرة.'
                    : 'Discover our luxury cosmetic collection and make your first atelier order.'}
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D4A5A5] px-6 py-2.5 text-xs font-bold text-[#0A0A0A] hover:bg-[#C89595] transition"
                >
                  <span>{isAr ? 'تصفح المتجر الآن' : 'Shop Collection'}</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {displayOrders.map((order: any, idx: number) => {
                  const step = getStepIndex(order.status);
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <div
                      key={order.id || idx}
                      className="rounded-3xl border border-white/10 bg-[#141414] p-5 md:p-6 shadow-xl space-y-5 transition hover:border-[#D4A5A5]/30"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#A1A1AA]">{isAr ? 'رقم الطلب:' : 'Order ID:'}</span>
                            <strong className="text-sm font-bold font-mono text-[#D4A5A5]">
                              #ROMA-{order.order_number || order.id}
                            </strong>
                          </div>
                          <span className="text-[11px] text-[#A1A1AA] block mt-0.5 font-mono">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG', { dateStyle: 'long' }) : 'تاريخ حديث'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Status Badge */}
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold border ${
                              isCancelled
                                ? 'bg-red-950/40 text-red-400 border-red-800/40'
                                : step === 4
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                                : step === 3
                                ? 'bg-blue-950/40 text-blue-400 border-blue-800/40'
                                : 'bg-[#D4A5A5]/15 text-[#D4A5A5] border-[#D4A5A5]/30'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? isAr ? 'تم التسليم بنجاح ✨' : 'Delivered'
                              : order.status === 'shipped'
                              ? isAr ? 'في الطريق للشحن 🚚' : 'Shipped'
                              : order.status === 'confirmed' || order.status === 'processing'
                              ? isAr ? 'تم التأكيد وجاري التجهيز ✅' : 'Confirmed'
                              : order.status === 'cancelled'
                              ? isAr ? 'ملغي ❌' : 'Cancelled'
                              : isAr ? 'قيد الانتظار ⏳' : 'Pending'}
                          </span>

                          <span className="text-base font-extrabold text-white font-mono-brand">
                            {formatPrice(order.total_amount)}
                          </span>
                        </div>
                      </div>

                      {/* LUXURY 4-STEP PROGRESS INDICATOR */}
                      {!isCancelled && (
                        <div className="py-2">
                          <span className="text-[11px] font-bold text-[#A1A1AA] block mb-3">
                            {isAr ? 'مراحل تجهيز وتوصيل الطلب:' : 'Order Tracking Progress:'}
                          </span>

                          <div className="relative flex items-center justify-between">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
                            <div
                              className="absolute top-1/2 right-0 h-0.5 bg-[#D4A5A5] -translate-y-1/2 z-0 transition-all duration-500"
                              style={{
                                width: step === 4 ? '100%' : step === 3 ? '66%' : step === 2 ? '33%' : '0%',
                              }}
                            />

                            {/* Step 1: Pending */}
                            <div className="relative z-10 flex flex-col items-center gap-1.5">
                              <div
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                                  step >= 1
                                    ? 'bg-[#D4A5A5] text-[#0A0A0A] border-[#D4A5A5] shadow-md shadow-[#D4A5A5]/30'
                                    : 'bg-[#1A1A1A] text-[#A1A1AA] border-white/10'
                                }`}
                              >
                                <Clock className="size-4" strokeWidth={2} />
                              </div>
                              <span className="text-[10px] md:text-xs font-semibold text-white">
                                {isAr ? 'قيد الانتظار' : 'Pending'}
                              </span>
                            </div>

                            {/* Step 2: Confirmed */}
                            <div className="relative z-10 flex flex-col items-center gap-1.5">
                              <div
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                                  step >= 2
                                    ? 'bg-[#D4A5A5] text-[#0A0A0A] border-[#D4A5A5] shadow-md shadow-[#D4A5A5]/30'
                                    : 'bg-[#1A1A1A] text-[#A1A1AA] border-white/10'
                                }`}
                              >
                                <CheckCircle2 className="size-4" strokeWidth={2} />
                              </div>
                              <span className="text-[10px] md:text-xs font-semibold text-white">
                                {isAr ? 'تم التأكيد' : 'Confirmed'}
                              </span>
                            </div>

                            {/* Step 3: Shipped */}
                            <div className="relative z-10 flex flex-col items-center gap-1.5">
                              <div
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                                  step >= 3
                                    ? 'bg-[#D4A5A5] text-[#0A0A0A] border-[#D4A5A5] shadow-md shadow-[#D4A5A5]/30'
                                    : 'bg-[#1A1A1A] text-[#A1A1AA] border-white/10'
                                }`}
                              >
                                <Truck className="size-4" strokeWidth={2} />
                              </div>
                              <span className="text-[10px] md:text-xs font-semibold text-white">
                                {isAr ? 'في الطريق' : 'Shipped'}
                              </span>
                            </div>

                            {/* Step 4: Delivered */}
                            <div className="relative z-10 flex flex-col items-center gap-1.5">
                              <div
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                                  step >= 4
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30'
                                    : 'bg-[#1A1A1A] text-[#A1A1AA] border-white/10'
                                }`}
                              >
                                <Sparkles className="size-4" strokeWidth={2} />
                              </div>
                              <span className="text-[10px] md:text-xs font-semibold text-white">
                                {isAr ? 'تم التسليم' : 'Delivered'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Items breakdown */}
                      <div className="rounded-2xl bg-[#1A1A1A]/80 border border-white/5 p-4 space-y-3">
                        <span className="text-xs font-bold text-[#A1A1AA] block">
                          {isAr ? 'تفاصيل المنتجات:' : 'Order Items:'}
                        </span>
                        <div className="space-y-2">
                          {(Array.isArray(order.items) ? order.items : []).map((it: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="size-5 rounded-md bg-[#252525] text-white flex items-center justify-center text-[10px] font-mono">
                                  {it.quantity}x
                                </span>
                                <span className="text-white font-medium">{it.name || it.product_name}</span>
                                {it.variant && (
                                  <span className="text-[#A1A1AA] text-[11px]">({it.variant})</span>
                                )}
                              </div>
                              <span className="text-[#D4A5A5] font-mono-brand">
                                {formatPrice((Number(it.price) || 0) * (Number(it.quantity) || 1))}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
                          <span>
                            📍 {isAr ? 'العنوان:' : 'Address:'} {order.shipping_address || order.address}
                          </span>
                          <span>
                            💳 {isAr ? 'طريقة الدفع:' : 'Payment:'} {order.payment_method || (isAr ? 'الدفع عند الاستلام' : 'COD')}
                          </span>
                        </div>
                      </div>

                      {/* Direct WhatsApp Concierge Button */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <a
                          href={`https://wa.me/201012345678?text=${encodeURIComponent(
                            isAr
                              ? `مرحباً، أود الاستفسار عن حالة طلبي رقم #ROMA-${order.order_number || order.id}:`
                              : `Hello, I'd like to ask about my order #ROMA-${order.order_number || order.id}:`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-xs font-bold text-[#25D366] transition"
                        >
                          <MessageCircle className="size-3.5" />
                          <span>{isAr ? 'تواصل مع خدمة العملاء بالواتساب' : 'WhatsApp Concierge'}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 md:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg md:text-xl font-bold font-display text-white">
                {isAr ? 'تعديل البيانات وعنوان التوصيل الافتراضي' : 'Profile & Default Delivery Address'}
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-1">
                {isAr
                  ? 'يتم استخدام هذه البيانات تلقائياً عند إتمام الطلب لتسريع تجربة الشراء.'
                  : 'Used to prefill your checkout information for 1-click seamless ordering.'}
              </p>
            </div>

            {profileSuccessMsg && (
              <div className="rounded-2xl bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                    {isAr ? 'الاسم بالكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isAr ? 'مثال: نورهان محمد' : 'e.g. Sarah Connor'}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1.5">
                    {isAr ? 'رقم الهاتف المحمول (للتوصيل)' : 'Mobile Phone (for delivery)'}
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
                    {isAr ? 'المحافظة' : 'Governorate / City'}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
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
                    {isAr ? 'العنوان التفصيلي (الشارع، العمارة، الشقة)' : 'Detailed Street Address'}
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder={isAr ? 'شارع الثورة، مصر الجديدة، عمارة 12...' : 'Street name, building number, apt...'}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 rounded-xl bg-[#D4A5A5] hover:bg-[#C89595] px-6 py-3 text-xs font-bold text-[#0A0A0A] shadow-md transition disabled:opacity-50"
                >
                  <Save className="size-4" />
                  <span>{savingProfile ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: REWARDS & LOCAL PAYMENT INFO */}
        {activeTab === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 flex items-center justify-center text-[#D4A5A5]">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isAr ? 'برنامج ولاء روما الفاخر' : 'Roma Loyalty Circle'}</h3>
                  <span className="text-xs text-[#A1A1AA]">{isAr ? 'استرجاع نقدي 5% مع كل طلب' : '5% cashback reward points'}</span>
                </div>
              </div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {isAr
                  ? 'كل عملية شراء تمنحكِ نقاطاً تلقائية تضاف إلى رصيدكِ يمكنكِ استبدالها بخصومات فورية وعينات مجانية من تشكيلتنا الجديدة.'
                  : 'Every order earns points redeemable for discounts, luxury samples, and private sales.'}
              </p>
              <div className="rounded-2xl bg-[#1A1A1A] p-4 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-white">{isAr ? 'الرصيد المتاح حالياً:' : 'Current Balance:'}</span>
                <strong className="text-base font-bold text-[#D4A5A5] font-mono-brand">
                  {user?.points ?? 50} {isAr ? 'نقطة' : 'points'}
                </strong>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 flex items-center justify-center text-[#D4A5A5]">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isAr ? 'طرق الدفع المحلية المعتمدة' : 'Accepted Egyptian Methods'}</h3>
                  <span className="text-xs text-[#A1A1AA]">{isAr ? 'محافظ إلكترونية وإنستاباي والدفع عند الاستلام' : 'Wallets, InstaPay, COD'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#A1A1AA]">
                <div className="rounded-xl bg-[#1A1A1A] p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium">فودافون كاش (Vodafone Cash)</span>
                  <span className="font-mono text-[#D4A5A5]">01012345678</span>
                </div>
                <div className="rounded-xl bg-[#1A1A1A] p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium">عنوان إنستاباي (InstaPay)</span>
                  <span className="font-mono text-[#D4A5A5]">roma.beauty@instapay</span>
                </div>
                <div className="rounded-xl bg-[#1A1A1A] p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium">الدفع عند الاستلام (COD)</span>
                  <span className="text-emerald-400 font-bold">{isAr ? 'متاح لجميع المحافظات' : 'Available nationwide'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
