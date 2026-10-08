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
  ChevronDown,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  Save,
  AlertCircle,
  LogOut,
  Lock,
  PackageCheck,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth, type UserOrder } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { supabase } from '@/lib/supabase';
import { GOVERNORATES } from '@/lib/shipping';

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, setAuthModalOpen, logout, fetchUserOrders, removeAddress } = useAuth();
  const { t, isAr, formatPrice, dir } = useLanguage();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'rewards'>('orders');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [recentOrderId, setRecentOrderId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('roma_latest_order_id');
    } catch {
      return null;
    }
  });

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

  // Set of order keys that have their product items list expanded
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  const toggleOrderExpanded = (orderKey: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderKey)) {
        next.delete(orderKey);
      } else {
        next.add(orderKey);
      }
      return next;
    });
  };

  // Sync tab with URL query parameters (?tab=orders / ?tab=profile)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'orders' || tabParam === 'profile' || tabParam === 'rewards') {
        setActiveTab(tabParam as any);
      }
    } catch (_) { }
  }, []);

  // If not authenticated, redirect to login page instead of showing guest account
  useEffect(() => {
    if (!user) {
      const hasStoredSession = (() => {
        try {
          return !!localStorage.getItem('roma_user_session');
        } catch {
          return false;
        }
      })();
      if (!hasStoredSession) {
        setLocation('/auth?tab=login');
      }
    }
  }, [user, setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation('/auth?tab=login');
  };

  useEffect(() => {
    if (user) {
      setFullName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.savedAddresses?.[0]) setAddressLine(user.savedAddresses[0]);
    }
  }, [user]);

  // Load orders for logged in or guest user
  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const res = await fetchUserOrders();
        setOrders(res || []);
      } catch (e) {
        console.warn('Orders fetch error:', e);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, [user]);

  // Helper to sync updated orders into localStorage and React state
  const syncOrderUpdates = (updatedList: any[]) => {
    if (!Array.isArray(updatedList) || updatedList.length === 0) return;
    try {
      const raw = localStorage.getItem('roma_recent_orders');
      if (raw) {
        const localList = JSON.parse(raw);
        if (Array.isArray(localList)) {
          let changed = false;
          for (const up of updatedList) {
            const upClean = String(up.order_number || up.id).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
            for (const loc of localList) {
              const locClean = String(loc.order_number || loc.id).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
              if (locClean === upClean || (upClean.length >= 4 && (locClean.includes(upClean) || upClean.includes(locClean)))) {
                if (loc.status !== up.status) {
                  loc.status = up.status;
                  loc.updated_at = up.updated_at || new Date().toISOString();
                  changed = true;
                }
              }
            }
          }
          if (changed) {
            localStorage.setItem('roma_recent_orders', JSON.stringify(localList));
          }
        }
      }
    } catch (_) { }

    // Instantly update React state so the UI step progress bar advances live without page refresh
    setLookupOrders((prev) => {
      const map = new Map(prev.map((o: any) => [String(o.order_number || o.id).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim(), o]));
      for (const up of updatedList) {
        const cleanKey = String(up.order_number || up.id).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
        const existing = map.get(cleanKey);
        const resolvedMethod =
          up.payment_method && !up.payment_method.includes('الاستلام') && !/cod/i.test(up.payment_method)
            ? up.payment_method
            : existing?.payment_method && !existing.payment_method.includes('الاستلام')
              ? existing.payment_method
              : (isAr ? 'فودافون كاش / المحافظ الإلكترونية' : 'Vodafone Cash / E-Wallet');
        map.set(cleanKey, { ...existing, ...up, payment_method: resolvedMethod });
      }
      return Array.from(map.values());
    });

    setOrders((prev) => {
      return prev.map((ord: any) => {
        const ordClean = String(ord.order_number || ord.id).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
        const match = updatedList.find((up: any) => {
          const upClean = String(up.order_number || up.id).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
          return ordClean === upClean || (upClean.length >= 4 && (ordClean.includes(upClean) || upClean.includes(ordClean)));
        });
        if (match && match.status !== ord.status) {
          return { ...ord, status: match.status, updated_at: match.updated_at || new Date().toISOString() };
        }
        return ord;
      });
    });
  };

  // Auto-fetch latest placed order details and recent orders on mount
  useEffect(() => {
    async function refreshActiveOrders() {
      const targets = new Set<string>();
      if (recentOrderId) {
        targets.add(String(recentOrderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, ''));
      }

      try {
        const raw = localStorage.getItem('roma_recent_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const o of parsed.slice(0, 5)) {
              const clean = String(o.order_number || o.id || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
              if (clean) targets.add(clean);
            }
          }
        }
      } catch (_) { }

      for (const target of targets) {
        try {
          const res = await fetch(`/api/track-order?orderNumber=${encodeURIComponent(target)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.orders) && json.orders.length > 0) {
              syncOrderUpdates(json.orders);
              setLookupOrders((prev) => {
                const combined = [...json.orders, ...prev];
                return Array.from(new Map(combined.map((o: any) => [String(o.order_number || o.id), o])).values());
              });
            }
          }
        } catch (_) { }
      }
    }

    refreshActiveOrders();
  }, [recentOrderId]);

  // Live auto-refresh: Update order status every 4 seconds in realtime
  useEffect(() => {
    const timer = setInterval(async () => {
      if (activeTab !== 'orders') return;

      const targets = new Set<string>();
      if (recentOrderId) {
        targets.add(String(recentOrderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim());
      }
      for (const o of lookupOrders.slice(0, 5)) {
        const num = String(o.order_number || o.id || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
        if (num) targets.add(num);
      }
      for (const o of orders.slice(0, 5)) {
        const num = String(o.order_number || o.id || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
        if (num) targets.add(num);
      }
      try {
        const raw = localStorage.getItem('roma_recent_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const o of parsed.slice(0, 5)) {
              const clean = String(o.order_number || o.id || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
              if (clean) targets.add(clean);
            }
          }
        }
      } catch (_) { }

      for (const num of targets) {
        try {
          const res = await fetch(`/api/track-order?orderNumber=${encodeURIComponent(num)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.orders) && json.orders.length > 0) {
              syncOrderUpdates(json.orders);
            }
          }
        } catch (_) { }
      }

      if (user) {
        try {
          const res = await fetchUserOrders();
          if (Array.isArray(res) && res.length > 0) setOrders(res);
        } catch (_) { }
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [activeTab, lookupOrders, orders, recentOrderId, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccessMsg('');

    try {
      // 1. Update Supabase Auth user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: fullName.trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          city,
          savedAddresses: [addressLine.trim()],
        },
      });

      if (!error) {
        setProfileSuccessMsg(
          isAr ? 'تم حفظ التعديلات بنجاح في ملفك الشخصي' : 'Profile settings updated successfully'
        );
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        console.warn('Update user metadata note:', error.message);
      }
    } catch (err: any) {
      console.error('Save profile error:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLookupOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = lookupPhone.trim();
    if (!query) return;
    setIsLookingUp(true);

    try {
      const cleanDigits = query.replace(/\D+/g, '');
      const isPhone = cleanDigits.length >= 10 && (cleanDigits.startsWith('01') || cleanDigits.startsWith('201'));
      const param = isPhone
        ? `phone=${encodeURIComponent(cleanDigits)}`
        : `orderNumber=${encodeURIComponent(query)}`;

      const res = await fetch(`/api/track-order?${param}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders)) {
          setLookupOrders(json.orders);
        } else {
          setLookupOrders([]);
        }
      } else {
        setLookupOrders([]);
      }
    } catch (e) {
      console.warn('Guest lookup error:', e);
      setLookupOrders([]);
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

  // Comprehensive order list merging: Lookup search + User history + Recent local orders
  const displayOrders = (() => {
    const map = new Map<string, any>();

    const mergeOrder = (o: any) => {
      if (!o) return;
      const cleanKey = String(o.order_number || o.id || o.orderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
      const normalized = {
        ...o,
        order_number: `ROMA-${cleanKey}`,
        tracking_url: o.tracking_url || o.trackingUrl || o.shipping_tracking_url || null,
      };
      if (!map.has(cleanKey)) {
        map.set(cleanKey, normalized);
      } else {
        const existing = map.get(cleanKey);
        const existingStep = getStepIndex(existing.status);
        const newStep = getStepIndex(o.status);
        const mergedTracking = normalized.tracking_url || existing.tracking_url || null;
        // Whichever has more advanced status or is non-pending wins
        if (newStep > existingStep || (existing.status === 'pending' && o.status && o.status !== 'pending')) {
          map.set(cleanKey, { ...existing, ...normalized, tracking_url: mergedTracking, status: o.status });
        } else {
          map.set(cleanKey, { ...existing, tracking_url: mergedTracking });
        }
      }
    };

    // 1. Lookups from API server
    for (const o of lookupOrders) mergeOrder(o);
    // 2. User account orders from DB
    for (const o of orders) mergeOrder(o);
    // 3. Browser local storage recent orders
    try {
      const raw = localStorage.getItem('roma_recent_orders');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const o of parsed) mergeOrder(o);
        }
      }
    } catch (_) { }

    return Array.from(map.values());
  })();

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
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                  alt={user?.name || "Profile"}
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
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-[#1A1A1A] hover:bg-white/5 text-xs text-[#A1A1AA] hover:text-white transition cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth?tab=login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4A5A5] hover:bg-[#C89595] text-xs font-bold text-[#0A0A0A] shadow-md transition"
              >
                <User className="size-4" />
                <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
              </Link>
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
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${activeTab === 'orders'
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
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${activeTab === 'profile'
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
            className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition ${activeTab === 'rewards'
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
            {recentOrderId && (
              <div className="rounded-2xl bg-gradient-to-r from-[#D4A5A5]/25 via-[#D4A5A5]/10 to-transparent border border-[#D4A5A5]/40 p-4.5 flex items-center justify-between gap-3 text-xs text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-[#D4A5A5]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="size-5 text-[#D4A5A5] animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#D4A5A5]">
                      {isAr ? '🎉 تم تأكيد واستلام طلبكِ بنجاح!' : '🎉 Your order has been placed successfully!'}
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      {isAr
                        ? `طلبكِ برقم (#ROMA-${String(recentOrderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '')}) تم تسجيله ويتم تجهيزه الآن بعناية. يمكنكِ متابعة مراحل الشحن مباشرة:`
                        : `Order (#ROMA-${String(recentOrderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '')}) is being prepared. Track your delivery stages below:`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('roma_latest_order_id');
                    setRecentOrderId(null);
                  }}
                  className="text-[#A1A1AA] hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Universal Real-Time Tracking Search (by Phone or Order Number) */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Phone className="size-4 text-[#D4A5A5]" />
                  <span>{isAr ? 'البحث عن طلب ومتابعة الشحن مباشرة:' : 'Search & Track Order Live:'}</span>
                </div>
                {lookupOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLookupOrders([]);
                      setLookupPhone('');
                    }}
                    className="text-[11px] text-[#A1A1AA] hover:text-white underline cursor-pointer"
                  >
                    {isAr ? 'إعادة التعيين' : 'Clear search'}
                  </button>
                )}
              </div>
              <form onSubmit={handleLookupOrders} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder={
                    isAr
                      ? 'أدخلي رقم الهاتف أو رقم الطلب (مثال: 010... أو ROMA-206876)'
                      : 'Enter phone or order ID (e.g. 010... or ROMA-...)'
                  }
                  className="flex-1 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                />
                <button
                  type="submit"
                  disabled={isLookingUp}
                  className="rounded-xl bg-[#D4A5A5] px-6 py-3 text-xs font-bold text-[#0A0A0A] hover:bg-[#C89595] transition shrink-0 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLookingUp ? (isAr ? 'جاري البحث...' : 'Searching...') : (isAr ? 'تتبع الطلب الآن 🔍' : 'Track Order 🔍')}
                </button>
              </form>
            </div>

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
                              #ROMA-{String(order.order_number || order.id || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '')}
                            </strong>
                          </div>
                          <span className="text-[11px] text-[#A1A1AA] block mt-0.5 font-mono">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG', { dateStyle: 'long' }) : 'تاريخ حديث'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Status Badge */}
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold border ${isCancelled
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
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${step >= 1
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
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${step >= 2
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
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${step >= 3
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
                                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${step >= 4
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30'
                                    : 'bg-[#1A1A1A] text-[#A1A1AA] border-white/10'
                                  }`}
                              >
                                <PackageCheck className="size-4" strokeWidth={2} />
                              </div>
                              <span className="text-[10px] md:text-xs font-semibold text-white">
                                {isAr ? 'تم التسليم' : 'Delivered'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Products Accordion / Collapsible (Hidden by default, toggle with arrow) */}
                      {(() => {
                        const orderKey = String(order.order_number || order.id || idx);
                        const isExpanded = expandedOrderIds.has(orderKey);
                        const items = Array.isArray(order.items) ? order.items : [];
                        const itemsCount = items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0) || items.length || 1;

                        return (
                          <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/70 overflow-hidden transition">
                            {/* Toggle Header Button with Arrow */}
                            <button
                              type="button"
                              onClick={() => toggleOrderExpanded(orderKey)}
                              className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition text-xs font-bold text-white cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-2">
                                <Package className="size-4 text-[#D4A5A5]" />
                                <span>
                                  {isAr
                                    ? `المنتجات في هذا الطلب (${itemsCount} ${itemsCount === 1 ? 'مستحضر' : 'مستحضرات'})`
                                    : `Order Items (${itemsCount} items)`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-[#D4A5A5] font-semibold">
                                <span>{isExpanded ? (isAr ? 'إخفاء المنتجات' : 'Hide') : (isAr ? 'عرض المنتجات' : 'Show')}</span>
                                <ChevronDown className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            {/* Collapsible Content */}
                            {isExpanded && (
                              <div className="border-t border-white/5 p-4 space-y-3 bg-[#161616] animate-in fade-in duration-200">
                                <div className="space-y-2.5">
                                  {items.map((it: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                                      <div className="flex items-center gap-2">
                                        <span className="size-5 rounded-md bg-[#252525] text-white flex items-center justify-center text-[10px] font-mono">
                                          {it.quantity || 1}x
                                        </span>
                                        <span className="text-white font-medium">{it.name || it.product_name}</span>
                                        {it.variant && (
                                          <span className="text-[#A1A1AA] text-[11px]">({it.variant})</span>
                                        )}
                                      </div>
                                      <span className="text-[#D4A5A5] font-mono-brand font-bold">
                                        {formatPrice((Number(it.price) || 0) * (Number(it.quantity) || 1))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Order address & payment footer */}
                            <div className="px-4 py-2.5 border-t border-white/5 bg-[#141414] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A1A1AA]">
                              <span>
                                📍 {isAr ? 'العنوان:' : 'Address:'} {order.shipping_address || order.address}
                              </span>
                              <span>
                                💳 {isAr ? 'طريقة الدفع:' : 'Payment:'}{' '}
                                {(() => {
                                  const pm = order.payment_method || order.paymentMethod;
                                  if (!pm || pm.includes('الاستلام') || /cod/i.test(pm)) {
                                    return isAr ? 'فودافون كاش / المحافظ الإلكترونية' : 'Vodafone Cash / E-Wallet';
                                  }
                                  return pm;
                                })()}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Actions: Customer Support & Live Tracking Button (Beneath WhatsApp Button) */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        {/* 1. Direct WhatsApp Concierge Button */}
                        <div className="flex justify-end">
                          <a
                            href={`https://wa.me/201505566847?text=${encodeURIComponent(
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

                        {/* 2. Courier Shipment Live Tracking Button (Directly beneath Customer Support) */}
                        <div className="flex justify-end">
                          {order.tracking_url || order.shipping_tracking_url ? (
                            <a
                              href={order.tracking_url || order.shipping_tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A5A5] to-[#B38888] hover:opacity-95 text-[#0A0A0A] text-xs font-bold shadow-md shadow-[#D4A5A5]/20 transition"
                            >
                              <Truck className="size-4" />
                              <span>{isAr ? 'تتبع الشحنة مع شركة الشحن 🚚' : 'Track Shipment with Courier 🚚'}</span>
                              <ExternalLink className="size-3.5" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                alert(
                                  isAr
                                    ? `📦 جاري تجهيز الشحنة للطلب #ROMA-${String(order.order_number || order.id).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '')} مع شركة الشحن.\nسيتم تفعيل رابط التتبع المباشر هنا فور تسليم الشحنة لمندوب التوصيل ورفع البوليصة!`
                                    : 'Shipment is being prepared with courier. Live tracking link will be activated here as soon as dispatched!'
                                );
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#D4A5A5] transition cursor-pointer"
                            >
                              <Truck className="size-3.5" />
                              <span>{isAr ? 'تتبع الشحنة (في انتظار بوليصة الشحن)' : 'Track Shipment (Pending Courier)'}</span>
                            </button>
                          )}
                        </div>
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
          !user ? (
            <div className="rounded-3xl border border-white/10 bg-[#141414] p-8 text-center space-y-6 shadow-xl">
              <div className="size-16 rounded-2xl bg-[#D4A5A5]/10 border border-[#D4A5A5]/20 flex items-center justify-center mx-auto text-[#D4A5A5]">
                <Lock className="size-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {isAr ? 'تسجيل الدخول مطلوب لإدارة الملف الشخصي' : 'Authentication Required'}
                </h3>
                <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto leading-relaxed">
                  {isAr
                    ? 'يرجى تسجيل الدخول أو إنشاء حساب جديد لحفظ بياناتكِ، وعناوين التوصيل، وتفضيلات الشراء.'
                    : 'Please sign in or create an account to manage your profile settings, saved addresses, and preferences.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-xs mx-auto">
                <Link
                  href="/auth?tab=login"
                  className="w-full py-2.5 rounded-xl bg-[#D4A5A5] hover:bg-[#C89595] text-xs font-bold text-[#0A0A0A] transition shadow-md"
                >
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
                <Link
                  href="/auth?tab=register"
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition"
                >
                  {isAr ? 'إنشاء حساب جديد' : 'Register'}
                </Link>
              </div>
            </div>
          ) : (
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

              {/* List of All Saved Addresses */}
              {Array.isArray(user?.savedAddresses) && user.savedAddresses.length > 0 && (
                <div className="pt-6 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MapPin className="size-4 text-[#D4A5A5]" />
                      <span>{isAr ? 'دفتر العناوين المحفوظة في حسابكِ:' : 'Saved Delivery Addresses:'}</span>
                    </h3>
                    <span className="text-[11px] text-[#A1A1AA]">
                      {user.savedAddresses.length} {isAr ? 'عنوان مسجل' : 'addresses'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {user.savedAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1A1A1A] border border-white/5 text-xs text-white group hover:border-[#D4A5A5]/30 transition"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <MapPin className="size-4 text-[#D4A5A5] shrink-0" />
                          <span className="truncate">{addr}</span>
                          {idx === 0 && (
                            <span className="shrink-0 text-[10px] bg-[#D4A5A5]/15 text-[#D4A5A5] border border-[#D4A5A5]/30 px-2 py-0.5 rounded-full font-semibold">
                              {isAr ? 'العنوان الأخير المعتمد' : 'Latest Default'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAddressLine(addr)}
                            className="text-[11px] text-[#A1A1AA] hover:text-[#D4A5A5] px-2 py-1 rounded-lg bg-white/5 border border-white/10 transition cursor-pointer"
                          >
                            {isAr ? 'تعيين كافتراضي' : 'Use Default'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAddress(idx)}
                            className="text-red-400 hover:text-red-300 p-1.5 text-xs rounded-lg hover:bg-red-950/30 transition cursor-pointer"
                            title={isAr ? 'حذف العنوان' : 'Remove address'}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
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
                  <span className="text-xs text-[#A1A1AA]">{isAr ? 'محافظ إلكترونية وإنستاباي' : 'Wallets & InstaPay'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#A1A1AA]">
                <div className="rounded-xl bg-[#1A1A1A] p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium">فودافون كاش (Vodafone Cash)</span>
                  <span className="font-mono text-[#D4A5A5]">01030920536</span>
                </div>
                <div className="rounded-xl bg-[#1A1A1A] p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium">يوزر إنستاباي (InstaPay Username)</span>
                  <span className="font-mono text-[#D4A5A5]">sbzgx</span>
                </div>
                <div className="rounded-xl bg-[#1A1A1A] p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium">رقم هاتف إنستاباي (InstaPay Phone)</span>
                  <span className="font-mono text-[#D4A5A5]">01150583501</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
