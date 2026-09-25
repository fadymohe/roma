import { X, User, Package, MapPin, Award, LogOut, Heart, Sparkles, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

export function UserDrawer() {
  const { user, userDrawerOpen, setUserDrawerOpen, logout, setWishlistDrawerOpen } = useAuth();

  if (!userDrawerOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={() => setUserDrawerOpen(false)}
    >
      <div
        className="fixed bottom-0 left-0 top-0 w-full max-w-sm bg-background p-6 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <User className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{user.name}</h3>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUserDrawerOpen(false)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Loyalty Points Card */}
          <div className="mt-5 rounded-3xl bg-gradient-to-br from-[#527E5F] to-[#3F6649] p-5 text-white shadow-lg shadow-[#4E7A5A]/20">
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

          {/* Actions List */}
          <div className="mt-6 space-y-2.5">
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
              <ChevronLeft className="size-4 text-muted-foreground" />
            </button>

            <Link
              href="/cart"
              onClick={() => setUserDrawerOpen(false)}
              className="flex w-full items-center justify-between rounded-2xl border border-border p-3.5 text-right transition hover:border-[#76A080] hover:bg-[#E8EFEA]/40"
            >
              <div className="flex items-center gap-3">
                <Package className="size-4 text-[#4E7A5A]" />
                <span className="text-sm font-medium text-foreground">سجل الطلبات والشحنات</span>
              </div>
              <span className="rounded-full bg-[#E8EFEA] px-2.5 py-0.5 text-[11px] font-bold text-[#2A4331]">
                {user.ordersCount} طلبات
              </span>
            </Link>

            <div className="rounded-2xl border border-border p-3.5 text-right">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="size-4 text-[#4E7A5A]" />
                <span className="text-sm font-medium text-foreground">العناوين المحفوظة</span>
              </div>
              {user.savedAddresses && user.savedAddresses.length > 0 ? (
                <div className="space-y-1.5 pl-2 text-xs text-muted-foreground">
                  {user.savedAddresses.map((addr, i) => (
                    <p key={i} className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#4E7A5A]" /> {addr}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">لم تقم بحفظ عناوين بعد.</p>
              )}
            </div>

            <div className="rounded-2xl bg-[#E8EFEA]/50 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
              <Sparkles className="size-4 text-[#4E7A5A] shrink-0" />
              <span>رقم العضوية: <strong className="text-foreground">{user.id.slice(0, 10).toUpperCase()}</strong></span>
            </div>
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="size-4" /> تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
