import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { useLuxuryLoader } from '@/components/luxury-loader';
import { Link, useLocation } from 'wouter';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, login, register, loginWithGoogle, resetPassword } = useAuth();
  const { t, isAr, dir } = useLanguage();
  const { showLoader } = useLuxuryLoader();

  // URL query param ?tab=register or ?tab=login
  const getInitialMode = (): 'login' | 'register' => {
    try {
      const tab = new URLSearchParams(window.location.search).get('tab');
      return tab === 'register' ? 'register' : 'login';
    } catch {
      return 'login';
    }
  };

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(getInitialMode);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States & Errors
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // WhatsApp OTP Verification Step
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // If already logged in, redirect to account page
  useEffect(() => {
    if (user) {
      setLocation('/account');
    }
  }, [user, setLocation]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVerifyingOtp && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [isVerifyingOtp, otpTimer]);

  // Password Strength
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
    ? ['ضعيفة جداً', 'ضعيفة', 'مقبولة', 'قوية 🔒', 'ممتازة ومحمية ✨']
    : ['Very Weak', 'Weak', 'Fair', 'Strong 🔒', 'Excellent ✨'];
  const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'];

  // Start WhatsApp Verification Step
  const initiateWhatsAppVerification = () => {
    // 1. Validate Two-part Name
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setErrorMsg(isAr ? 'الاسم يجب أن يكون ثنائياً على الأقل (مثال: نورا أحمد)' : 'Full name must consist of at least two words (First and Last name)');
      return;
    }

    // 2. Validate Email
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(isAr ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please provide a valid email address');
      return;
    }

    // 3. Validate Phone Number (Egyptian format)
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم هاتف صحيح للتأكيد عبر واتساب' : 'Please provide a valid phone number for WhatsApp verification');
      return;
    }

    // 4. Validate Password
    if (password.length < 6) {
      setErrorMsg(isAr ? 'كلمة المرور يجب أن تكون ٦ خانات على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setErrorMsg(null);

    // Generate random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setEnteredOtp('');
    setOtpTimer(60);
    setCanResendOtp(false);
    setIsVerifyingOtp(true);
  };

  // Resend OTP
  const handleResendOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpTimer(60);
    setCanResendOtp(false);
    setErrorMsg(null);
  };

  // Confirm OTP and complete registration
  const handleConfirmOtp = async () => {
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMsg(isAr ? 'رمز التحقق غير صحيح، يرجى كتابة الرمز المكون من ٦ أرقام' : 'Invalid verification code. Please check and try again.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await register(name.trim(), email.trim(), phone.trim(), password);
      if (res.success) {
        showLoader(isAr ? 'تم تأكيد الحساب بنجاح! جاري تحضير ملفك الملكي...' : 'Verified! Preparing your profile...', 500);
        setTimeout(() => {
          setLocation('/account');
        }, 500);
      } else {
        setErrorMsg(res.error || (isAr ? 'حدث خطأ أثناء حفظ الحساب' : 'Registration error'));
        setLoading(false);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error occurred');
      setLoading(false);
    }
  };

  // Handle Form Submission (Login, Forgot, or Register initial step)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'register') {
      initiateWhatsAppVerification();
      return;
    }

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg(isAr ? 'يرجى كتابة البريد الإلكتروني لإرسال الرابط' : 'Please enter your email');
        return;
      }
      setLoading(true);
      const res = await resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
      return;
    }

    // Login Mode
    if (!email.trim() || !password) {
      setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide both email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        showLoader(isAr ? 'مرحباً بكِ في روما! جاري الدخول...' : 'Welcome back! Logging in...', 500);
        setTimeout(() => {
          setLocation('/account');
        }, 500);
      } else {
        setErrorMsg(res.error || (isAr ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password'));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isAr ? 'فشل تسجيل الدخول' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        showLoader(isAr ? 'تم تسجيل الدخول عبر Google بنجاح!' : 'Signed in with Google!', 500);
        setTimeout(() => {
          setLocation('/account');
        }, 500);
      } else {
        setErrorMsg(res.error || 'Google Sign-in failed');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Google Auth error');
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    isAr
      ? `رمز تأكيد حسابي في متجر روما هو: ${generatedOtp} ✨`
      : `My ROMA verification code is: ${generatedOtp} ✨`
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F9FAFB] py-12 px-4 relative overflow-hidden" dir={dir}>
      {/* Ambient Radial Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(212,165,165,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[radial-gradient(ellipse_at_center,rgba(200,149,149,0.06),transparent_65%)] pointer-events-none" />

      <div className="roma-container max-w-lg relative z-10">
        {/* Top Logo & Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block transition transform hover:scale-105 active:scale-95 mb-4">
            <img
              src="/logo-transparent.png"
              alt="ROMA"
              className="h-16 w-auto max-w-[200px] mx-auto object-contain drop-shadow-[0_4px_20px_rgba(212,165,165,0.3)] brightness-110"
            />
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white">
            {mode === 'login'
              ? (isAr ? 'تسجيل الدخول في ROMA' : 'Sign In to ROMA')
              : mode === 'register'
              ? (isAr ? 'إنشاء حساب جديد ببيانات حقيقية' : 'Create a New Account')
              : (isAr ? 'استعادة كلمة المرور' : 'Reset Password')}
          </h1>
          <p className="mt-1.5 text-xs md:text-sm text-zinc-400">
            {isAr
              ? 'بوابتك الحصرية لمستحضرات التجميل الملكية، العناية الفاخرة، ومتابعة الطلبات.'
              : 'Your portal to bespoke organic cosmetics, royal formulations, and express order tracking.'}
          </p>
        </div>

        {/* Auth Card with Framer Motion Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#141414] via-[#121212] to-[#0D0D0D] p-6 sm:p-8 shadow-2xl shadow-black/80 relative"
        >
          {/* Tabs: Login vs Register */}
          {mode !== 'forgot' && !isVerifyingOtp && (
            <div className="grid grid-cols-2 p-1 mb-6 rounded-2xl bg-[#1C1C1C] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`relative py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  mode === 'login'
                    ? 'text-[#0A0A0A] shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode === 'login' && (
                  <motion.div
                    layoutId="active-auth-tab"
                    className="absolute inset-0 bg-[#D4A5A5] rounded-xl"
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`relative py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  mode === 'register'
                    ? 'text-[#0A0A0A] shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode === 'register' && (
                  <motion.div
                    layoutId="active-auth-tab"
                    className="absolute inset-0 bg-[#D4A5A5] rounded-xl"
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{isAr ? 'إنشاء حساب جديد' : 'Create Account'}</span>
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 rounded-2xl bg-rose-950/40 border border-rose-800/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5 shadow-sm"
              >
                <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5 shadow-sm"
              >
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp Verification Step Container */}
          {isVerifyingOtp ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <MessageCircle className="size-8" />
                </div>
                <h3 className="font-bold text-lg text-white">
                  {isAr ? 'التحقق من رقم الهاتف عبر واتساب' : 'WhatsApp Phone Verification'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  {isAr ? (
                    <>
                      يرجى الضغط على الزر أدناه لإرسال كود التأكيد إلى رقمك 
                      <strong className="text-emerald-400 font-mono mx-1 font-bold">({phone})</strong> 
                      ثم كتابة الرمز لإتمام إنشاء الحساب.
                    </>
                  ) : (
                    <>A verification code has been prepared for your phone number {phone}.</>
                  )}
                </p>
              </div>

              {/* Direct WhatsApp Action Button */}
              <a
                href={`https://wa.me/201505566849?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-4 font-bold text-sm shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.02] active:scale-95 text-center"
              >
                <MessageCircle className="size-5" />
                <span>{isAr ? 'فتح واتساب لتأكيد رمز التفعيل 💬' : 'Open WhatsApp to Confirm Code 💬'}</span>
              </a>

              {/* Highlight Box showing Code for User Convenience */}
              <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-white/10 text-center">
                <span className="text-[11px] text-zinc-400 block mb-1">
                  {isAr ? 'رمز التحقق الخاص بك هو:' : 'Your 6-digit Code:'}
                </span>
                <span className="text-2xl font-extrabold font-mono tracking-widest text-[#D4A5A5]">
                  {generatedOtp}
                </span>
              </div>

              {/* OTP Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block text-center">
                  {isAr ? 'أدخلي رمز التحقق المكون من ٦ أرقام' : 'Enter 6-digit Verification Code'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-2xl bg-[#181818] border border-white/15 focus:border-[#D4A5A5] text-white outline-none"
                  autoFocus
                />
              </div>

              {/* Action Buttons: Confirm & Resend */}
              <button
                type="button"
                onClick={handleConfirmOtp}
                disabled={enteredOtp.length < 6 || loading}
                className="w-full py-3.5 rounded-2xl bg-[#D4A5A5] hover:bg-[#C89595] text-[#0A0A0A] font-extrabold text-sm transition-all shadow-lg shadow-[#D4A5A5]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loading
                  ? (isAr ? 'جاري التحقق وإنشاء الحساب...' : 'Verifying and Creating Account...')
                  : (isAr ? 'تأكيد الحساب والدخول ✓' : 'Verify & Complete Account ✓')}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
                <button
                  type="button"
                  onClick={() => setIsVerifyingOtp(false)}
                  className="hover:text-white transition flex items-center gap-1"
                >
                  {isAr ? <ArrowRight className="size-3.5" /> : <ArrowLeft className="size-3.5" />}
                  <span>{isAr ? 'تعديل البيانات' : 'Edit Info'}</span>
                </button>

                {canResendOtp ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#D4A5A5] font-bold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>{isAr ? 'إعادة إرسال الرمز' : 'Resend Code'}</span>
                  </button>
                ) : (
                  <span>
                    {isAr ? `إعادة الإرسال بعد (${otpTimer} ثانية)` : `Resend in (${otpTimer}s)`}
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            /* Regular Login / Register Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Google OAuth Login Button */}
              {mode !== 'forgot' && (
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-[#181818] hover:bg-[#202020] hover:border-white/30 py-3 px-4 text-xs sm:text-sm font-bold text-white transition-all shadow-sm active:scale-95 group"
                  >
                    <svg className="size-5 shrink-0" viewBox="0 0 24 24">
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
                    <span>{isAr ? 'متابعة سريعة عبر حساب Google' : 'Continue with Google Account'}</span>
                  </button>

                  <div className="relative my-5 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <span className="relative bg-[#141414] px-4 text-xs text-zinc-500 font-medium">
                      {isAr ? 'أو بالبيانات الشخصية' : 'or enter details'}
                    </span>
                  </div>
                </div>
              )}

              {/* Registration: Name Field (Must have at least 2 words) */}
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">
                    {isAr ? 'الاسم بالكامل (ثنائياً على الأقل)' : 'Full Name (First & Last)'} <span className="text-[#D4A5A5]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAr ? 'مثال: نورا أحمد' : 'e.g. Noura Ahmed'}
                      className="w-full rounded-2xl border border-white/10 bg-[#181818] p-3 ps-10 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#D4A5A5] transition shadow-inner"
                    />
                    <UserIcon className="absolute top-3.5 start-3 size-4 text-zinc-400" />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    {isAr ? 'يجب كتابة اسمين على الأقل لتسليم الشحنات بدقة' : 'Please provide at least first and last name'}
                  </span>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-[#D4A5A5]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-[#181818] p-3 ps-10 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#D4A5A5] transition shadow-inner"
                  />
                  <Mail className="absolute top-3.5 start-3 size-4 text-zinc-400" />
                </div>
              </div>

              {/* Registration: Phone Field (Validated via WhatsApp) */}
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">
                    {isAr ? 'رقم الهاتف للتأكيد عبر واتساب' : 'Phone for WhatsApp Verification'} <span className="text-[#D4A5A5]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full rounded-2xl border border-white/10 bg-[#181818] p-3 ps-10 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#D4A5A5] transition font-mono shadow-inner"
                    />
                    <Phone className="absolute top-3.5 start-3 size-4 text-zinc-400" />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block flex items-center gap-1">
                    <MessageCircle className="size-3 text-emerald-400" />
                    <span>{isAr ? 'سيتم إرسال رمز تأكيد مباشر على هذا الرقم' : 'We will verify this phone number via WhatsApp'}</span>
                  </span>
                </div>
              )}

              {/* Password Field */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
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
                        className="text-xs text-[#D4A5A5] hover:underline font-medium"
                      >
                        {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
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
                      className="w-full rounded-2xl border border-white/10 bg-[#181818] p-3 ps-10 pe-10 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#D4A5A5] transition shadow-inner font-mono"
                    />
                    <Lock className="absolute top-3.5 start-3 size-4 text-zinc-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-3 end-3 p-0.5 text-zinc-400 hover:text-white"
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator on Register */}
                  {mode === 'register' && password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{isAr ? 'مستوى الأمان:' : 'Strength:'}</span>
                        <span className="font-bold text-white">{strengthLabels[Math.min(passStrength, 4)]}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 h-1">
                        {[0, 1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`rounded-full transition-all ${
                              step < passStrength ? strengthColors[Math.min(passStrength - 1, 4)] : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-2xl bg-[#D4A5A5] hover:bg-[#C89595] p-3.5 text-xs sm:text-sm font-extrabold text-[#0A0A0A] shadow-xl shadow-[#D4A5A5]/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 rounded-full border-2 border-[#0A0A0A] border-t-transparent animate-spin" />
                    <span>{isAr ? 'جاري المعالجة...' : 'Processing...'}</span>
                  </span>
                ) : mode === 'login' ? (
                  isAr ? 'تسجيل الدخول' : 'Sign In'
                ) : mode === 'register' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span>{isAr ? 'متابعة وتأكيد الرقم عبر واتساب' : 'Continue to WhatsApp Verification'}</span>
                    {isAr ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                  </span>
                ) : (
                  isAr ? 'إرسال رابط استعادة المرور' : 'Send Reset Link'
                )}
              </button>

              {/* Forgot password back link */}
              {mode === 'forgot' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-[#D4A5A5] hover:underline font-bold"
                  >
                    {isAr ? '← العودة لتسجيل الدخول' : '← Back to Login'}
                  </button>
                </div>
              )}

              {/* Trust Badge */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                <ShieldCheck className="size-3.5 text-[#D4A5A5]" />
                <span>{isAr ? 'بياناتك مشفرة ومحمية ببروتوكول SSL-256' : 'Encrypted with 256-Bit SSL Protection'}</span>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
