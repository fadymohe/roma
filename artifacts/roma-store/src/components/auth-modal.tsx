import { useState } from 'react';
import { X, Sparkles, Lock, Mail, User, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLoginTab) {
        if (!email) {
          setMessage('يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
          setLoading(false);
          return;
        }
        await login(email, password);
      } else {
        if (!name || !email) {
          setMessage('يرجى إدخال الاسم والبريد الإلكتروني');
          setLoading(false);
          return;
        }
        await register(name, email, phone, password);
      }
    } catch {
      setMessage('حدث خطأ، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    await login('noura@roma-eg.my', '123456');
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header background with sage accent */}
        <div className="relative bg-[#E8EFEA] p-6 pb-5 text-center border-b border-[#DEE6E0]">
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-white/80 hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>

          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
            <img src="/logo-transparent.png" alt="Logo" className="h-full w-full object-contain" />
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground">
            {isLoginTab ? 'أهلاً بكِ مجدداً' : 'انضمي إلى نادينا الطبيعي'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLoginTab
              ? 'سجلي دخولك للوصول إلى طلباتك ونقاط المكافآت'
              : 'أنشئي حسابك الآن واحصلي على 50 نقطة ترحيبية وخصم 10%'}
          </p>

          {/* Tab Switcher */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-white/70 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setMessage(null); }}
              className={`rounded-full py-2 transition ${
                isLoginTab
                  ? 'bg-[#4E7A5A] text-white shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setMessage(null); }}
              className={`rounded-full py-2 transition ${
                !isLoginTab
                  ? 'bg-[#4E7A5A] text-white shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-5">
          {message && (
            <div className="rounded-full bg-red-50 p-2.5 text-center text-xs font-medium text-red-600 border border-red-200">
              {message}
            </div>
          )}

          {!isLoginTab && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                الاسم الكامل <span className="text-[#4E7A5A]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full rounded-full border border-border bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-[#76A080] focus:ring-2 focus:ring-[#76A080]/20"
                />
                <User className="absolute right-3.5 top-3 size-4 text-muted-foreground" />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              البريد الإلكتروني <span className="text-[#4E7A5A]">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-full border border-border bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-[#76A080] focus:ring-2 focus:ring-[#76A080]/20"
              />
              <Mail className="absolute right-3.5 top-3 size-4 text-muted-foreground" />
            </div>
          </div>

          {!isLoginTab && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                رقم الجوال (اختياري)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-full border border-border bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-[#76A080] focus:ring-2 focus:ring-[#76A080]/20"
                />
                <Phone className="absolute right-3.5 top-3 size-4 text-muted-foreground" />
              </div>
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                كلمة المرور <span className="text-[#4E7A5A]">*</span>
              </label>
              {isLoginTab && (
                <button
                  type="button"
                  onClick={() => alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك المسجل.')}
                  className="text-[11px] text-[#4E7A5A] hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-full border border-border bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-[#76A080] focus:ring-2 focus:ring-[#76A080]/20"
              />
              <Lock className="absolute right-3.5 top-3 size-4 text-muted-foreground" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#4E7A5A] py-3 text-sm font-bold text-white shadow-md shadow-[#4E7A5A]/25 transition hover:bg-[#3F6649] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جارٍ التحقق...
              </span>
            ) : isLoginTab ? (
              'تسجيل الدخول'
            ) : (
              'إنشاء الحساب وبدء التسوق'
            )}
          </button>

          {/* Quick Demo Login */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="inline-flex items-center gap-1.5 text-xs text-[#4E7A5A] font-medium hover:underline"
            >
              <Sparkles className="size-3.5" /> الدخول السريع كعميل تجريبي (Demo)
            </button>
          </div>

          {/* Perks Preview */}
          <div className="mt-3 rounded-2xl bg-[#E8EFEA]/60 p-3 text-[11px] text-muted-foreground border border-[#DEE6E0]">
            <div className="flex items-center gap-1.5 font-bold text-[#2A4331] mb-1.5">
              <Sparkles className="size-3.5 text-[#4E7A5A]" /> مميزات عضوية ROMA:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-[#4E7A5A]" /> 50 نقطة فورية
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-[#4E7A5A]" /> عينات مجانية
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-[#4E7A5A]" /> تتبع شحناتك
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-[#4E7A5A]" /> عروض حصرية
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
