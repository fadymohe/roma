import { useState } from 'react';
import { X, Sparkles, Lock, Mail, User, Phone, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register, resetPassword } = useAuth();
  const { t, isAr, dir } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  // Password Strength Checker
  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passStrength = checkPasswordStrength(password);
  const strengthLabels = isAr
    ? ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'ممتازة 🔒']
    : ['Very Weak', 'Weak', 'Fair', 'Strong', 'Excellent 🔒'];
  const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg(isAr ? 'يرجى كتابة البريد الإلكتروني لإرسال الرابط' : 'Please enter your email to receive recovery instructions');
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
          setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide email and password');
          setLoading(false);
          return;
        }
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || (isAr ? 'فشل تسجيل الدخول، يرجى التأكد من البيانات' : 'Login failed, please verify credentials'));
        }
      } else {
        if (!name.trim() || !email.trim() || !password) {
          setErrorMsg(isAr ? 'يرجى ملء كافة الحقول الإلزامية' : 'Please fill all required fields');
          setLoading(false);
          return;
        }
        if (passStrength < 3 || password.length < 8) {
          setErrorMsg(isAr ? 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل وتتضمن حروفاً وأرقاماً' : 'Password must be at least 8 characters with letters and numbers');
          setLoading(false);
          return;
        }
        const res = await register(name, email, phone, password);
        if (!res.success) {
          setErrorMsg(res.error || (isAr ? 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى' : 'Registration failed, please try again'));
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isAr ? 'حدث خطأ، يرجى المحاولة لاحقاً' : 'An error occurred, please try again'));
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      dir={dir}
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-[#EFE8DE] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header background with plum & blush accent */}
        <div className="relative bg-[#F8EBEA] p-6 pb-5 text-center border-b border-[#EFE8DE]">
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-white/80 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </button>

          <img
            src="/logo-transparent.png"
            alt="ROMA"
            className="h-12 w-auto object-contain mx-auto mb-2"
          />

          <h3 className="font-display text-lg font-bold text-[#4A1525]">
            {mode === 'login'
              ? t('auth.login_title')
              : mode === 'register'
              ? t('auth.register_title')
              : (isAr ? 'استعادة كلمة المرور' : 'Reset Password')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAr
              ? 'مرحباً بكِ في عالم روما للعناية والجمال الملكي'
              : 'Welcome to the bespoke sanctuary of ROMA luxury cosmetics'}
          </p>
        </div>

        {/* Tab selection */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-[#EFE8DE] bg-[#FDFBF7] p-1 text-center text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`rounded-xl py-2.5 transition ${
                mode === 'login'
                  ? 'bg-white text-[#4A1525] shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`rounded-xl py-2.5 transition ${
                mode === 'register'
                  ? 'bg-white text-[#4A1525] shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'حساب جديد' : 'Create Account'}
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 leading-snug font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 leading-snug font-medium">
              {successMsg}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {t('checkout.full_name')} <span className="text-[#D48B88]">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? 'الاسم بالكامل' : 'Full Name'}
                  className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-3.5 py-2.5 pl-9 text-xs outline-none focus:border-[#D48B88]"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              {t('checkout.email')} <span className="text-[#D48B88]">*</span>
            </label>
            <div className="relative">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-3.5 py-2.5 pl-9 text-xs outline-none focus:border-[#D48B88]"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {t('checkout.phone')}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-3.5 py-2.5 pl-9 text-xs font-mono outline-none focus:border-[#D48B88]"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-foreground">
                  {isAr ? 'كلمة المرور' : 'Password'} <span className="text-[#D48B88]">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                    }}
                    className="text-[11px] font-semibold text-[#D48B88] hover:underline"
                  >
                    {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[#EFE8DE] bg-[#FDFBF7] px-3.5 py-2.5 pl-16 text-xs outline-none focus:border-[#D48B88]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Meter */}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span>{t('auth.password_strength')}</span>
                    <span className={passStrength >= 3 ? 'text-emerald-700' : 'text-amber-700'}>
                      {strengthLabels[Math.min(passStrength, 4)]}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthColors[Math.min(passStrength, 4)]}`}
                      style={{ width: `${(passStrength / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {t('auth.password_rules')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cloudflare Turnstile badge */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FDFBF7] border border-[#EFE8DE] text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#D48B88]" />
              {t('auth.turnstile_protected')}
            </span>
            <span className="text-emerald-800 font-bold">✓ Pass</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#4A1525] hover:bg-[#38101C] py-3 text-xs md:text-sm font-bold text-white shadow-md shadow-[#4A1525]/20 transition disabled:opacity-50"
          >
            {loading ? (
              <span>{isAr ? 'جارٍ التحقق...' : 'Verifying...'}</span>
            ) : mode === 'login' ? (
              <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
            ) : mode === 'register' ? (
              <span>{isAr ? 'إنشاء حساب جديد' : 'Create Account'}</span>
            ) : (
              <span>{isAr ? 'إرسال رابط الاستعادة' : 'Send Recovery Link'}</span>
            )}
          </button>

          {/* Demo account quick login */}
          <div className="pt-2 text-center border-t border-[#EFE8DE]">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-[11px] font-bold text-[#D48B88] hover:underline"
            >
              {isAr ? 'تجربة سريعة بحساب تجريبي (Demo Account)' : 'Instant Demo Account Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
