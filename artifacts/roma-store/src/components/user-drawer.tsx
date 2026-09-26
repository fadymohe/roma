import { useState, useEffect } from 'react';
import {
  X,
  User,
  Package,
  MapPin,
  Award,
  LogOut,
  Heart,
  Sparkles,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth, type UserOrder } from '@/hooks/use-auth';
import { Link } from 'wouter';

export function UserDrawer() {
  const {
    user,
    userDrawerOpen,
    setUserDrawerOpen,
    logout,
    setWishlistDrawerOpen,
    addAddress,
    removeAddress,
    addPaymentMethod,
    removePaymentMethod,
    fetchUserOrders,
  } = useAuth();

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrdersSection, setShowOrdersSection] = useState(false);

  // New address state
  const [newAddressInput, setNewAddressInput] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // New payment method state
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [selectedPayType, setSelectedPayType] = useState<'vodafone' | 'card' | 'fawry' | 'cod'>('vodafone');
  const [payTitle, setPayTitle] = useState('');

  useEffect(() => {
    if (userDrawerOpen && user) {
      setLoadingOrders(true);
      fetchUserOrders()
        .then((data) => setOrders(data))
        .catch(console.error)
        .finally(() => setLoadingOrders(false));
    }
  }, [userDrawerOpen, user]);

  if (!userDrawerOpen || !user) return null;

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressInput.trim()) return;
    await addAddress(newAddressInput.trim());
    setNewAddressInput('');
    setIsAddingAddress(false);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const titles = {
      vodafone: payTitle.trim() || 'فودافون كاش / محفظة إلكترونية',
      card: payTitle.trim() || 'بطاقة بنكية (Visa / Mastercard)',
      fawry: payTitle.trim() || 'فوري (Fawry Pay)',
      cod: 'الدفع نقداً عند الاستلام',
    };

    await addPaymentMethod({
      type: selectedPayType,
      title: titles[selectedPayType],
    });

    setPayTitle('');
    setIsAddingPayment(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={() => setUserDrawerOpen(false)}
    >
      <div
        className="fixed bottom-0 left-0 top-0 w-full max-w-md bg-background p-6 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#E8EFEA] text-[#4E7A5A] shadow-xs">
                <User className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">{user.name}</h3>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                {user.phone && <p className="text-[11px] text-muted-foreground">{user.phone}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUserDrawerOpen(false)}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="إغلاق"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Loyalty Points Card */}
          <div className="rounded-3xl bg-gradient-to-br from-[#527E5F] to-[#3F6649] p-5 text-white shadow-lg shadow-[#4E7A5A]/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold opacity-90">رصيد نقاط المكافآت VIP</span>
              <Award className="size-5 text-white/90" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold">{user.points}</span>
              <span className="text-xs opacity-90">نقطة مكافأة</span>
            </div>
            <p className="mt-1 text-[11px] opacity-85 text-emerald-50">
              تساوي خصم {user.points} ج.م على طلبك القادم!
            </p>
          </div>

          {/* Wishlist Link */}
          <button
            type="button"
            onClick={() => {
              setUserDrawerOpen(false);
              setWishlistDrawerOpen(true);
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-border p-3.5 text-right transition hover:border-[#76A080] hover:bg-[#E8EFEA]/40"
          >
            <div className="flex items-center gap-3">
              <Heart className="size-4 text-[#4E7A5A]" />
              <span className="text-sm font-medium text-foreground">قائمة الرغبات والمفضلة</span>
            </div>
            <span className="text-xs text-muted-foreground">عرض العناصر</span>
          </button>

          {/* Saved Addresses Section */}
          <div className="rounded-2xl border border-border p-4 text-right bg-white shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-[#4E7A5A]" />
                <span className="text-sm font-bold text-foreground">العناوين المحفوظة</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="inline-flex items-center gap-1 rounded-full bg-[#E8EFEA] px-2.5 py-1 text-[11px] font-bold text-[#2A4331] hover:bg-[#DEE6E0] transition"
              >
                <Plus className="size-3" /> إضافة عنوان
              </button>
            </div>

            {isAddingAddress && (
              <form onSubmit={handleSaveAddress} className="mb-3 space-y-2 rounded-xl bg-[#FAFBF9] p-3 border border-[#DEE6E0]">
                <input
                  type="text"
                  required
                  value={newAddressInput}
                  onChange={(e) => setNewAddressInput(e.target.value)}
                  placeholder="مثال: القاهرة، المعادي، شارع 9، عمارة 15"
                  className="w-full rounded-full border border-border bg-white px-3.5 py-2 text-xs outline-none focus:border-[#76A080]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#4E7A5A] px-4 py-1 text-xs font-bold text-white hover:bg-[#3F6649]"
                  >
                    حفظ العنوان
                  </button>
                </div>
              </form>
            )}

            {user.savedAddresses && user.savedAddresses.length > 0 ? (
              <div className="space-y-2">
                {user.savedAddresses.map((addr, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-[#FAFBF9] p-2.5 text-xs text-foreground border border-border/60"
                  >
                    <span className="flex-1 truncate pl-2">{addr}</span>
                    <button
                      type="button"
                      onClick={() => removeAddress(i)}
                      className="text-muted-foreground hover:text-red-600 transition p-1"
                      aria-label="حذف العنوان"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">لا توجد عناوين محفوظة بعد. يمكنكِ إضافة عنوانكِ هنا لتعبئته تلقائياً عند الدفع.</p>
            )}
          </div>

          {/* Saved Payment Methods Section */}
          <div className="rounded-2xl border border-border p-4 text-right bg-white shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-[#4E7A5A]" />
                <span className="text-sm font-bold text-foreground">طرق الدفع المفضلة</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPayment(!isAddingPayment)}
                className="inline-flex items-center gap-1 rounded-full bg-[#E8EFEA] px-2.5 py-1 text-[11px] font-bold text-[#2A4331] hover:bg-[#DEE6E0] transition"
              >
                <Plus className="size-3" /> إضافة طريقة
              </button>
            </div>

            {isAddingPayment && (
              <form onSubmit={handleSavePaymentMethod} className="mb-3 space-y-2 rounded-xl bg-[#FAFBF9] p-3 border border-[#DEE6E0]">
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPayType('vodafone')}
                    className={`rounded-full py-1.5 px-2 border text-center transition ${
                      selectedPayType === 'vodafone' ? 'bg-[#4E7A5A] text-white border-[#4E7A5A]' : 'bg-white border-border'
                    }`}
                  >
                    فودافون كاش
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayType('card')}
                    className={`rounded-full py-1.5 px-2 border text-center transition ${
                      selectedPayType === 'card' ? 'bg-[#4E7A5A] text-white border-[#4E7A5A]' : 'bg-white border-border'
                    }`}
                  >
                    بطاقة بنكية
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayType('fawry')}
                    className={`rounded-full py-1.5 px-2 border text-center transition ${
                      selectedPayType === 'fawry' ? 'bg-[#4E7A5A] text-white border-[#4E7A5A]' : 'bg-white border-border'
                    }`}
                  >
                    فوري
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayType('cod')}
                    className={`rounded-full py-1.5 px-2 border text-center transition ${
                      selectedPayType === 'cod' ? 'bg-[#4E7A5A] text-white border-[#4E7A5A]' : 'bg-white border-border'
                    }`}
                  >
                    عند الاستلام
                  </button>
                </div>

                {selectedPayType !== 'cod' && (
                  <input
                    type="text"
                    value={payTitle}
                    onChange={(e) => setPayTitle(e.target.value)}
                    placeholder="ملاحظات (مثال: محفظتي 010XXXXX أو فيزا البنك الأهلي)"
                    className="w-full rounded-full border border-border bg-white px-3.5 py-2 text-xs outline-none focus:border-[#76A080]"
                  />
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingPayment(false)}
                    className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#4E7A5A] px-4 py-1 text-xs font-bold text-white hover:bg-[#3F6649]"
                  >
                    حفظ طريقة الدفع
                  </button>
                </div>
              </form>
            )}

            {user.savedPaymentMethods && user.savedPaymentMethods.length > 0 ? (
              <div className="space-y-2">
                {user.savedPaymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between rounded-xl bg-[#FAFBF9] p-2.5 text-xs text-foreground border border-border/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#4E7A5A]" />
                      <span className="font-medium">{pm.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePaymentMethod(pm.id)}
                      className="text-muted-foreground hover:text-red-600 transition p-1"
                      aria-label="حذف طريقة الدفع"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">لا توجد طرق دفع مسجلة.</p>
            )}
          </div>

          {/* Supabase Orders History Accordion */}
          <div className="rounded-2xl border border-border p-4 text-right bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setShowOrdersSection(!showOrdersSection)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Package className="size-4 text-[#4E7A5A]" />
                <span className="text-sm font-bold text-foreground">طلباتي من قاعدة البيانات</span>
                <span className="rounded-full bg-[#E8EFEA] px-2 py-0.5 text-[11px] font-bold text-[#2A4331]">
                  {orders.length}
                </span>
              </div>
              {showOrdersSection ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>

            {showOrdersSection && (
              <div className="mt-3 space-y-2.5 pt-2 border-t border-border">
                {loadingOrders ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-[#4E7A5A] border-t-transparent mr-2" />
                    جارٍ جلب الطلبات من Supabase...
                  </div>
                ) : orders.length > 0 ? (
                  orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-xl bg-[#FAFBF9] p-3 border border-border text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2A4331]">طلب #{ord.id}</span>
                        <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                          {ord.status || 'مؤكد'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                        <span>المبلغ: <strong className="text-foreground">{ord.total_amount} ج.م</strong></span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(ord.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      {ord.shipping_address && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          العنوان: {ord.shipping_address}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-3 text-center text-xs text-muted-foreground">
                    لا توجد طلبات مسجلة باسمكِ حتى الآن.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Membership Badge */}
          <div className="rounded-2xl bg-[#E8EFEA]/50 p-3 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#4E7A5A] shrink-0" />
              <span>معرّف الحساب المربوط:</span>
            </div>
            <strong className="font-mono text-foreground text-[11px]">
              {user.id.slice(0, 12)}...
            </strong>
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="border-t border-border pt-4 mt-6">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="size-4" /> تسجيل الخروج من الحساب
          </button>
        </div>
      </div>
    </div>
  );
}
