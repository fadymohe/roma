import { Link, useLocation } from 'wouter';
import { Heart, Menu, Search, ShoppingBag, Sparkles, X, User, LogIn, Bell, LayoutGrid, Home as HomeIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '@/components/auth-modal';
import { UserDrawer } from '@/components/user-drawer';
import { WishlistDrawer } from '@/components/wishlist-drawer';
import { SearchModal } from '@/components/search-modal';

export function StoreShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { count } = useCart();
  const {
    user,
    setAuthModalOpen,
    setUserDrawerOpen,
    wishlist,
    setWishlistDrawerOpen,
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);

  const nav = [
    { href: '/', label: 'الرئيسية' },
    { href: '/shop', label: 'المتجر الكامل' },
    { href: '/shop?category=skincare', label: 'العناية بالبشرة' },
    { href: '/shop?category=lipstick', label: 'الشفاه والقلوس' },
    { href: '/shop?category=complexion', label: 'الوجه والأساس' },
    { href: '/shop?category=fragrance', label: 'العطور الفاخرة' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FAFBF9] dark:bg-background text-foreground pb-20 md:pb-8" dir="rtl">
      {/* Top Luxury Announcement Bar - Sage Botanical Gradient */}
      <div className="bg-gradient-to-r from-[#24422D] via-[#335A3D] to-[#24422D] px-4 py-2 text-center text-[12px] font-medium tracking-wide text-white/95 shadow-xs border-b border-white/10">
        <div className="roma-container flex items-center justify-center gap-2">
          <Sparkles className="size-3.5 text-emerald-300 animate-pulse" />
          <span>توصيل مجاني للطلبات فوق 500 ج.م · استخدمي كود <strong className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-white">ROUTINE10</strong> لخصم 10%</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-[#E2EBE5]/80 bg-[#FAFBF9]/90 backdrop-blur-md transition-all">
        <div className="roma-container flex h-[76px] md:h-[88px] items-center justify-between gap-4">
          {/* Left section: User avatar + Notification bell + Grid icon (Inspired by Image 1 & 3) */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* User Profile Avatar */}
            {user ? (
              <button
                type="button"
                aria-label="الملف الشخصي"
                data-testid="button-user-profile"
                onClick={() => setUserDrawerOpen(true)}
                className="group flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#76A080] p-0.5 transition hover:scale-105 shadow-xs"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              </button>
            ) : (
              <button
                type="button"
                aria-label="تسجيل الدخول"
                data-testid="button-login"
                onClick={() => setAuthModalOpen(true)}
                className="flex size-10 items-center justify-center rounded-full border border-[#DEE6E0] bg-white text-foreground shadow-xs hover:border-[#76A080] transition"
              >
                <User className="size-4 text-foreground/80" />
              </button>
            )}

            {/* Notification Bell with Badge '02' as in reference images */}
            <button
              type="button"
              aria-label="الإشعارات"
              onClick={() => alert('لديكِ إشعاران جديدان: خصم 10% متاح الآن وشحن مجاني اليوم!')}
              className="relative flex size-10 items-center justify-center rounded-full border border-[#DEE6E0] bg-white text-foreground/80 shadow-xs hover:border-[#76A080] hover:text-foreground transition"
            >
              <Bell className="size-4" strokeWidth={1.8} />
              <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-[#76A080] text-[10px] font-bold text-white shadow-xs">
                02
              </span>
            </button>

            {/* Grid menu icon '::' */}
            <button
              type="button"
              aria-label="فتح القائمة والتصنيفات"
              data-testid="button-open-menu"
              onClick={() => setMenuOpen(true)}
              className="flex size-10 items-center justify-center rounded-full border border-[#DEE6E0] bg-white text-foreground/80 shadow-xs hover:border-[#76A080] transition"
            >
              <LayoutGrid className="size-4" strokeWidth={1.8} />
            </button>
          </div>

          {/* Centered Brand Logo */}
          <Link
            href="/"
            data-testid="link-logo"
            className="flex items-center gap-2 transition transform hover:scale-105 active:scale-95 py-1"
          >
            <img
              src="/logo-transparent.png"
              alt="Logo"
              className="h-12 w-auto object-contain md:h-16 drop-shadow-xs"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 text-[13px] font-semibold text-foreground/85 xl:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-all hover:text-[#527E5F] ${
                  location === item.href ? 'font-bold text-[#527E5F]' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right section: Search circle + Wishlist + Cart button */}
          <div className="flex items-center gap-2.5 md:gap-3">
            {/* Circular Search Button as in mockup */}
            <button
              type="button"
              aria-label="البحث"
              data-testid="link-search"
              onClick={() => setSearchOpen(true)}
              className="flex size-10 items-center justify-center rounded-full border border-[#DEE6E0] bg-white text-foreground/80 shadow-xs hover:border-[#76A080] hover:text-[#527E5F] transition"
            >
              <Search className="size-4.5" strokeWidth={2} />
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              aria-label="المفضلة"
              data-testid="button-favorites"
              onClick={() => setWishlistDrawerOpen(true)}
              className="relative flex size-10 items-center justify-center rounded-full border border-[#DEE6E0] bg-white text-foreground/80 shadow-xs hover:border-[#76A080] hover:text-[#527E5F] transition"
            >
              <Heart className={`size-4.5 ${wishlist.length > 0 ? 'fill-[#527E5F] text-[#527E5F]' : ''}`} strokeWidth={1.8} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#527E5F] text-[9px] font-bold text-white shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Pill Button */}
            <Link
              href="/cart"
              data-testid="link-cart"
              className="relative flex items-center gap-2 rounded-full bg-[#4E7A5A] hover:bg-[#436A4E] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#4E7A5A]/20 transition active:scale-95"
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">السلة</span>
              {count > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white font-mono-brand text-[10px] font-bold text-[#4E7A5A] shadow-xs">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative z-10 flex h-full w-[85%] max-w-sm flex-col bg-[#FAFBF9] p-6 shadow-2xl border-l border-[#DEE6E0]">
            <div className="flex items-center justify-between border-b border-[#DEE6E0] pb-4">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <img src="/logo-transparent.png" alt="Logo" className="h-14 w-auto object-contain" />
              </Link>
              <button
                type="button"
                aria-label="إغلاق القائمة"
                className="rounded-full p-2 text-foreground/70 hover:bg-[#E8EFEA]"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-6 flex flex-col space-y-1.5">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    location === item.href
                      ? 'bg-[#E8EFEA] font-bold text-[#4E7A5A]'
                      : 'text-foreground/80 hover:bg-[#E8EFEA]/60'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-[#DEE6E0] pt-6">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setUserDrawerOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl bg-[#E8EFEA] p-3 text-xs font-bold text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-[#4E7A5A]" />
                    <span>حسابي ({user.name})</span>
                  </div>
                  <span className="rounded-full bg-[#4E7A5A] px-2.5 py-0.5 text-white font-bold">
                    {user.points} نقطة
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full rounded-full bg-[#4E7A5A] py-3 text-center text-xs font-bold text-white shadow-md"
                >
                  تسجيل الدخول / إنشاء حساب
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="min-h-[calc(100vh-280px)]">{children}</main>

      {/* Signature Floating Glassmorphism Bottom Dock Navigation (From Images 1, 3, 5) */}
      <nav
        aria-label="شريط التنقل السريع"
        className="floating-dock fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-6 md:gap-9 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-xl border border-[#DEE6E0] dark:border-border/60 px-6 py-2 shadow-2xl shadow-black/15 transition-all"
      >
        {/* Home */}
        <Link
          href="/"
          data-testid="dock-link-home"
          aria-label="الرئيسية"
          className={`flex items-center justify-center transition-all ${
            location === '/'
              ? 'size-10 rounded-full bg-[#76A080] text-white shadow-sm scale-105'
              : 'size-9 text-foreground/70 hover:text-foreground hover:scale-105'
          }`}
        >
          <HomeIcon className="size-5" />
        </Link>

        {/* Shop / Catalog */}
        <Link
          href="/shop"
          data-testid="dock-link-shop"
          aria-label="المتجر"
          className={`relative flex items-center justify-center transition-all ${
            location.startsWith('/shop')
              ? 'size-10 rounded-full bg-[#76A080] text-white shadow-sm scale-105'
              : 'size-9 text-foreground/70 hover:text-foreground hover:scale-105'
          }`}
        >
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#3D694A] text-[9px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>

        {/* Wishlist */}
        <button
          type="button"
          data-testid="dock-button-wishlist"
          aria-label="المفضلة"
          onClick={() => setWishlistDrawerOpen(true)}
          className="relative flex size-9 items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 transition-all"
        >
          <Heart className={`size-5 ${wishlist.length > 0 ? 'fill-[#76A080] text-[#76A080]' : ''}`} />
          {wishlist.length > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#76A080] text-[9px] font-bold text-white">
              {wishlist.length}
            </span>
          )}
        </button>

        {/* User / Profile */}
        <button
          type="button"
          data-testid="dock-button-user"
          aria-label="الحساب"
          onClick={() => (user ? setUserDrawerOpen(true) : setAuthModalOpen(true))}
          className="flex size-9 items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 transition-all"
        >
          <User className="size-5" />
        </button>
      </nav>

      {/* Popups & Drawers */}
      <AuthModal />
      <UserDrawer />
      <WishlistDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Luxury Botanical Sage Footer */}
      <footer className="mt-20 border-t border-[#DEE6E0] bg-[#F1F6F2]">
        <div className="roma-container grid gap-12 py-16 md:grid-cols-4">
          {/* Col 1: Brand & Logo */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <img src="/logo-transparent.png" alt="Logo" className="h-20 md:h-24 w-auto object-contain drop-shadow-sm" />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              علامة تجميل راقية تعتني بأدق تفاصيل إشراقتك. تركيبات لطيفة، ألوان فاخرة، وثبات يدوم بكل ثقة.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-bold text-primary">
              <span>شحن سريع لجميع أنحاء الجمهورية</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-display text-base font-bold text-foreground tracking-wide mb-4">
              تسوقي المنتجات
            </h4>
            <div className="space-y-2.5 text-sm">
              <Link href="/shop" className="block text-muted-foreground hover:text-primary transition">كل المنتجات</Link>
              <Link href="/shop?category=الوجه" className="block text-muted-foreground hover:text-primary transition">كريمات واستعادة نضارة الوجه</Link>
              <Link href="/shop?category=سيروم" className="block text-muted-foreground hover:text-primary transition">سيرومات النضارة والمسام</Link>
              <Link href="/shop?category=مرطبات" className="block text-muted-foreground hover:text-primary transition">مرطبات نباتية مركزة</Link>
              <Link href="/shop?category=الشفاه" className="block text-muted-foreground hover:text-primary transition">مرطبات وعناية الشفاه</Link>
              <Link href="/shop?category=العطور والجسم" className="block text-muted-foreground hover:text-primary transition">العطور ورذاذ الجسم</Link>
            </div>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="font-display text-base font-bold text-foreground tracking-wide mb-4">
              خدمة العملاء
            </h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="block hover:text-primary transition text-right"
              >
                تسجيل الدخول / إنشاء حساب
              </button>
              <button
                type="button"
                onClick={() => setWishlistDrawerOpen(true)}
                className="block hover:text-primary transition text-right"
              >
                قائمة المنتجات المفضلة
              </button>
              <Link href="/cart" className="block hover:text-primary transition">سلة الشراء والشحن</Link>
              <p className="text-xs text-muted-foreground pt-1">خدمة العملاء واتساب: <strong>+20 10 1234 5678</strong></p>
              <p className="text-xs text-muted-foreground">ساعات العمل: 9 صباحاً — 10 مساءً</p>
            </div>
          </div>

          {/* Col 4: Newsletter & Exclusive Offers */}
          <div>
            <h4 className="font-display text-base font-bold text-foreground tracking-wide mb-4">
              النادي الجمالي الخاص
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground mb-4">
              اشتركي لتصلكِ أحدث الإصدارات الحصرية والخصومات الخاصة على بريدك.
            </p>
            <form
              className="flex rounded-xl border border-border bg-background p-1 shadow-sm focus-within:border-primary"
              onSubmit={(e) => {
                e.preventDefault();
                if (newsletterEmail) setNewsletterSent(true);
              }}
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={newsletterSent ? 'تم اشتراككِ بنجاح شكراً لكِ!' : 'بريدك الإلكتروني...'}
                disabled={newsletterSent}
                className="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                {newsletterSent ? 'مشتركة' : 'اشتركي'}
              </button>
            </form>

            {/* Payment badges - Egyptian Payment Options */}
            <div className="mt-6">
              <p className="text-[11px] text-muted-foreground mb-2">طرق دفع آمنة وسهلة:</p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-muted-foreground">
                <span className="rounded bg-background px-2.5 py-1 border border-border">فودافون كاش</span>
                <span className="rounded bg-background px-2.5 py-1 border border-border">ميزة Meeza</span>
                <span className="rounded bg-background px-2.5 py-1 border border-border">Visa</span>
                <span className="rounded bg-background px-2.5 py-1 border border-border">Mastercard</span>
                <span className="rounded bg-background px-2.5 py-1 border border-border">فوري Fawry</span>
                <span className="rounded bg-background px-2.5 py-1 border border-border">الدفع عند الاستلام</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/80 py-5">
          <div className="roma-container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
            <span>© 2026 متجر روما للعناية والجمال · ROMA · جميع الحقوق محفوظة</span>
            <span className="flex items-center gap-3">
              <span>سياسة الخصوصية</span>
              <span>·</span>
              <span>الشروط والأحكام</span>
              <span>·</span>
              <span>شحن سريع ومؤمن لجميع المحافظات</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}