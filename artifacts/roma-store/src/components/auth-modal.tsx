import { useState } from 'react';
import { X, Sparkles, Lock, Mail, User, Phone, CheckCircle2, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('يرجى كتابة البريد الإلكتروني لإرسال الرابط');
          setLoading(false);
          return;
        }
        const res = await resetPassword(email);
        if (res.success) {
          setSuccessMsg(res.message);
        } else {
          setErrorMsg(res.message);
        }
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        if (!email.trim() || !password) {
          setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
          setLoading(false);
          return;
        }
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'فشل تسجيل الدخول، يرجى التأكد من البيانات');
        }
      } else {
        if (!name.trim() || !email.trim() || !password) {
          setErrorMsg('يرجى ملء كافة الحقول الإلزامية');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام');
          setLoading(false);
          return;
        }
        const res = await register(name, email, phone, password);
        if (!res.success) {
          setErrorMsg(res.error || 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setErrorMsg(null);
    await login('noura@roma-eg.my', 'Password123!');
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
            {mode === 'login'
              ? 'أهلاً بكِ مجدداً في ROMA'
              : mode === 'register'
              ? 'انضمي إلى نادينا الطبيعي'
              : 'استعادة كلمة المرور'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === 'login'
              ? 'سجلي دخولك للوصول إلى طلباتك وعناوينك ونقاط المكافآت'
              : mode === 'register'
              ? 'أنشئي حسابك الآن واحصلي على 50 نقطة ترحيبية فورية'
              : 'أدخلي بريدكِ المسجل وسنرسل لكِ رابطاً لإعادة تعيين كلمة المرور'}
          </p>

          {/* Tab Switcher (Only if not in forgot mode) */}
          {mode !== 'forgot' ? (
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-white/70 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`rounded-full py-2 transition ${
                  mode === 'login'
                    ? 'bg-[#4E7A5A] text-white shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`rounded-full py-2 transition ${
                  mode === 'register'
                    ? 'bg-[#4E7A5A] text-white shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                إنشاء حساب جديد
              </button>
            </div>
          ) : (
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#4E7A5A] hover:underline"
              >
                <ArrowRight className="size-3.5" /> العودة لتسجيل الدخول
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-5">
          {errorMsg && (
            <div className="rounded-2xl bg-red-50 p-3 text-center text-xs font-medium text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-2xl bg-emerald-50 p-3 text-center text-xs font-medium text-emerald-800 border border-emerald-200">
              {successMsg}
            </div>
          )}

          {mode === 'register' && (
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
                  placeholder="مثال: نورا أحمد"
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

          {mode === 'register' && (
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

          {mode !== 'forgot' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  كلمة المرور <span className="text-[#4E7A5A]">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                    className="text-[11px] text-[#4E7A5A] hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-full border border-border bg-white px-10 py-2.5 pr-10 text-sm outline-none transition focus:border-[#76A080] focus:ring-2 focus:ring-[#76A080]/20"
                />
                <Lock className="absolute right-3.5 top-3 size-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-3 text-muted-foreground hover:text-foreground"
                  aria-label="تبديل إظهار كلمة المرور"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#4E7A5A] py-3 text-sm font-bold text-white shadow-md shadow-[#4E7A5A]/25 transition hover:bg-[#3F6649] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جارٍ الاتصال بقاعدة البيانات...
              </span>
            ) : mode === 'login' ? (
              'تسجيل الدخول'
            ) : mode === 'register' ? (
              'إنشاء الحساب وبدء التسوق'
            ) : (
              'إرسال رابط إعادة التعيين'
            )}
          </button>

          {/* Quick Demo Login */}
          {mode === 'login' && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="inline-flex items-center gap-1.5 text-xs text-[#4E7A5A] font-medium hover:underline"
              >
                <Sparkles className="size-3.5" /> الدخول السريع كعميل تجريبي (Demo)
              </button>
            </div>
          )}

          {/* Security & Cloud badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="size-3.5 text-[#4E7A5A]" />
            <span>قاعدة بيانات مشفرة ومؤمنة عبر Supabase Cloud</span>
          </div>

          {/* Perks Preview */}
          <div className="mt-2 rounded-2xl bg-[#E8EFEA]/60 p-3 text-[11px] text-muted-foreground border border-[#DEE6E0]">
            <div className="flex items-center gap-1.5 font-bold text-[#2A4331] mb-1.5">
              <Sparkles className="size-3.5 text-[#4E7A5A]" /> مميزات حسابكِ في ROMA:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-[#4E7A5A]" /> 50 نقطة فورية
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-[#4E7A5A]" /> حفظ العناوين وطرق الدفع
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-[#4E7A5A]" /> مزامنة السلة على أجهزتك
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-[#4E7A5A]" /> تتبع شحناتك المباشرة
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
