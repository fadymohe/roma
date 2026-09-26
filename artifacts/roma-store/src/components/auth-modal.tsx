import { useState } from 'react';
import { X, Sparkles, Lock, Mail, User, Phone, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { supabase } from '@/lib/supabase';

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google Auth error');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
      dir={dir}
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#141414] shadow-2xl animate-in zoom-in-95 duration-200 text-[#F9FAFB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header background with pitch black & rose gold accent */}
        <div className="relative bg-[#1A1A1A] p-6 pb-5 text-center border-b border-white/10">
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="absolute left-4 top-4 rounded-full p-2 text-[#A1A1AA] transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </button>

          <div className="flex flex-col items-center mb-2">
            <span className="font-display text-2xl font-extrabold tracking-widest text-white">ROMA</span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4A5A5] font-semibold -mt-1">
              Cosmetics & Jewelry
            </span>
          </div>

          <h3 className="font-display text-lg font-bold text-white">
            {mode === 'login'
              ? t('auth.login_title')
              : mode === 'register'
              ? t('auth.register_title')
              : (isAr ? 'استعادة كلمة المرور' : 'Reset Password')}
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            {isAr
              ? 'مرحباً بكِ في عالم روما للعناية والجمال الفاخر'
              : 'Welcome to the sanctuary of ROMA luxury cosmetics'}
          </p>
        </div>

        {/* Tab switch */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-white/10 bg-[#101010]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-3 text-xs font-bold transition ${
                mode === 'login'
                  ? 'border-b-2 border-[#D4A5A5] text-[#D4A5A5] bg-[#141414]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              {t('auth.tab_login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-3 text-xs font-bold transition ${
                mode === 'register'
                  ? 'border-b-2 border-[#D4A5A5] text-[#D4A5A5] bg-[#141414]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              {t('auth.tab_register')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-red-950/40 border border-red-800/40 p-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google OAuth Login Button */}
          {mode !== 'forgot' && (
            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-[#1A1A1A] hover:bg-white/5 py-2.5 px-4 text-xs font-bold text-white transition shadow-sm"
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
                <span>{isAr ? 'متابعة عبر حساب Google' : 'Continue with Google'}</span>
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-[#141414] px-3 text-[11px] text-[#A1A1AA]">
                  {isAr ? 'أو عبر البريد الإلكتروني' : 'or with email'}
                </span>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-white block mb-1">
                {isAr ? 'الاسم بالكامل' : 'Full Name'} <span className="text-[#D4A5A5]">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? 'مثال: ندى الأحمد' : 'e.g. Nada Ahmed'}
                  className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#A1A1AA]" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-white block mb-1">
              {isAr ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-[#D4A5A5]">*</span>
            </label>
            <div className="relative">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#A1A1AA]" />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-white block mb-1">
                {isAr ? 'رقم الهاتف (للتوصيل)' : 'Phone Number'}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5] font-mono"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#A1A1AA]" />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-white">
                  {isAr ? 'كلمة المرور' : 'Password'} <span className="text-[#D4A5A5]">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                    }}
                    className="text-[11px] font-semibold text-[#D4A5A5] hover:underline"
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
                  className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2.5 text-xs text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#D4A5A5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Meter */}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span>{t('auth.password_strength')}</span>
                    <span className={passStrength >= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                      {strengthLabels[Math.min(passStrength, 4)]}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthColors[Math.min(passStrength, 4)]}`}
                      style={{ width: `${(passStrength / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#A1A1AA]">
                    {t('auth.password_rules')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Protection badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A1A1A] border border-white/10 text-[10px] text-[#A1A1AA]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#D4A5A5]" />
              {t('auth.turnstile_protected')}
            </span>
            <span className="text-emerald-400 font-bold">✓ 256-Bit SSL</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D4A5A5] hover:bg-[#C89595] py-3 text-xs md:text-sm font-bold text-[#0A0A0A] shadow-md shadow-[#D4A5A5]/20 transition disabled:opacity-50"
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
          <div className="pt-2 text-center border-t border-white/10">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-[11px] font-bold text-[#D4A5A5] hover:underline"
            >
              {isAr ? 'دخول فوري بحساب تجريبي (Instant Demo)' : 'Instant Demo Account Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
