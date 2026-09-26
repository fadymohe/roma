import { Link, useLocation } from 'wouter';
import {
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  X,
  User,
  Bell,
  LayoutGrid,
  Home as HomeIcon,
  Globe,
  ShieldCheck,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { AuthModal } from '@/components/auth-modal';
import { UserDrawer } from '@/components/user-drawer';
import { WishlistDrawer } from '@/components/wishlist-drawer';
import { SearchModal } from '@/components/search-modal';

export function StoreShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { count } = useCart();
  const { t, lang, toggleLang, isAr, dir } = useLanguage();
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
    { href: '/', label: t('nav.home') },
    { href: '/shop', label: t('nav.shop') },
    { href: '/shop?category=face', label: t('nav.face') },
    { href: '/shop?category=serum', label: t('nav.serums') },
    { href: '/shop?category=skincare', label: t('nav.skincare') },
    { href: '/shop?category=moisturizers', label: t('nav.moisturizers') },
    { href: '/shop?category=lips', label: t('nav.lips') },
    { href: '/shop?category=accessories', label: t('nav.accessories') },
    { href: '/policies', label: t('nav.policies') },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-foreground pb-20 md:pb-8" dir={dir}>
      {/* Top Luxury Announcement Bar - Deep Plum & Rose Gold */}
      <div className="bg-[#4A1525] text-[#FDFBF7] px-4 py-2 text-center text-[12px] font-medium tracking-wide shadow-xs border-b border-[#D48B88]/20">
        <div className="roma-container flex items-center justify-between md:justify-center gap-3">
          <div className="flex items-center gap-2 mx-auto">
            <Sparkles className="size-3.5 text-[#E8A598] animate-pulse" />
            <span>
              {t('common.free_shipping_notice')}{' '}
              <strong className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-white text-[11px]">
                ROMA10 (-10%)
              </strong>
            </span>
          </div>

          {/* Quick Language Toggle in Top Bar for Desktop */}
          <button
            type="button"
            onClick={toggleLang}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition shrink-0"
            title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="size-3 text-[#E8A598]" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-[#EFE8DE] bg-[#FDFBF7]/90 backdrop-blur-md transition-all">
        <div className="roma-container flex h-[76px] md:h-[88px] items-center justify-between gap-3 md:gap-4">
          {/* Left section: User avatar + Notification bell + Language switch */}
          <div className="flex items-center gap-2 md:gap-2.5">
            {/* User Profile Avatar / Login */}
            {user ? (
              <button
                type="button"
                aria-label={t('nav.account')}
                data-testid="button-user-profile"
                onClick={() => setUserDrawerOpen(true)}
                className="group flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#D48B88] p-0.5 transition hover:scale-105 shadow-xs"
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
                aria-label={t('nav.login')}
                data-testid="button-login"
                onClick={() => setAuthModalOpen(true)}
                className="flex size-10 items-center justify-center rounded-full border border-[#EFE8DE] bg-white text-foreground shadow-xs hover:border-[#D48B88] transition"
              >
                <User className="size-4 text-foreground/80" strokeWidth={1.5} />
              </button>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => alert(isAr ? 'لديكِ إشعاران: خصم 10% عبر كود ROMA10 وشحن مجاني للطلبات فوق 500 ج.م!' : '2 Notifications: 10% OFF with code ROMA10 & Free Express Delivery over 500 EGP!')}
              className="relative hidden sm:flex size-10 items-center justify-center rounded-full border border-[#EFE8DE] bg-white text-foreground/80 shadow-xs hover:border-[#D48B88] hover:text-foreground transition"
            >
              <Bell className="size-4" strokeWidth={1.5} />
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#4A1525] text-[9px] font-bold text-white shadow-xs">
                2
              </span>
            </button>

            {/* Bilingual Toggle Button in Navbar */}
            <button
              type="button"
              onClick={toggleLang}
              aria-label="Toggle Language"
              className="flex items-center gap-1.5 h-10 px-3 rounded-full border border-[#EFE8DE] bg-white text-xs font-bold text-[#4A1525] hover:border-[#D48B88] hover:bg-[#F8EBEA] transition shadow-xs"
            >
              <Globe className="size-3.5 text-[#D48B88]" strokeWidth={1.5} />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Menu icon for mobile */}
            <button
              type="button"
              aria-label="Open Menu"
              data-testid="button-open-menu"
              onClick={() => setMenuOpen(true)}
              className="flex xl:hidden size-10 items-center justify-center rounded-full border border-[#EFE8DE] bg-white text-foreground/80 shadow-xs hover:border-[#D48B88] transition"
            >
              <LayoutGrid className="size-4" strokeWidth={1.5} />
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
              alt="ROMA"
              className="h-12 w-auto object-contain md:h-16 drop-shadow-xs"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-5 text-[13px] font-semibold text-foreground/85 xl:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-all hover:text-[#4A1525] ${
                  location === item.href ? 'font-bold text-[#4A1525] border-b-2 border-[#D48B88] pb-1' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right section: Search + Wishlist + Cart button */}
          <div className="flex items-center gap-2 md:gap-2.5">
            {/* Circular Search Button */}
            <button
              type="button"
              aria-label={t('nav.search_placeholder')}
              data-testid="link-search"
              onClick={() => setSearchOpen(true)}
              className="flex size-10 items-center justify-center rounded-full border border-[#EFE8DE] bg-white text-foreground/80 shadow-xs hover:border-[#D48B88] hover:text-[#4A1525] transition"
            >
              <Search className="size-4" strokeWidth={1.5} />
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              aria-label={t('nav.wishlist')}
              data-testid="button-favorites"
              onClick={() => setWishlistDrawerOpen(true)}
              className="relative flex size-10 items-center justify-center rounded-full border border-[#EFE8DE] bg-white text-foreground/80 shadow-xs hover:border-[#D48B88] hover:text-[#4A1525] transition"
            >
              <Heart
                className={`size-4 ${wishlist.length > 0 ? 'fill-[#D48B88] text-[#D48B88]' : ''}`}
                strokeWidth={1.5}
              />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#4A1525] text-[9px] font-bold text-white shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              data-testid="link-cart"
              className="relative flex items-center gap-2 rounded-full bg-[#4A1525] hover:bg-[#38101C] px-3.5 md:px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#4A1525]/20 transition active:scale-95"
            >
              <ShoppingBag className="size-4 text-[#E8A598]" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('nav.cart')}</span>
              {count > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-[#D48B88] font-mono-brand text-[10px] font-bold text-[#4A1525] shadow-xs">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" dir={dir}>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          <div className="relative z-10 flex h-full w-[85%] max-w-sm flex-col bg-[#FDFBF7] p-6 shadow-2xl border-x border-[#EFE8DE]">
            <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-4">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <img src="/logo-transparent.png" alt="ROMA" className="h-14 w-auto object-contain" />
              </Link>
              <button
                type="button"
                aria-label="Close Menu"
                className="rounded-full p-2 text-foreground/70 hover:bg-[#F8EBEA]"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="py-4 border-b border-[#EFE8DE] flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {isAr ? 'لغة المتجر' : 'Store Language'}
              </span>
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#EFE8DE] text-xs font-bold text-[#4A1525]"
              >
                <Globe className="size-3.5 text-[#D48B88]" />
                <span>{isAr ? 'English' : 'العربية'}</span>
              </button>
            </div>

            <nav className="flex flex-col gap-3 py-4 text-sm font-semibold">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-2.5 transition ${
                    location === item.href
                      ? 'bg-[#F8EBEA] font-bold text-[#4A1525]'
                      : 'text-foreground/80 hover:bg-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-[#EFE8DE] pt-4 text-xs text-muted-foreground space-y-2">
              <p>📍 {isAr ? 'القاهرة، جمهورية مصر العربية' : 'Cairo, Arab Republic of Egypt'}</p>
              <p>📞 {isAr ? 'خدمة العملاء واتساب: 01012345678' : 'WhatsApp Client Support: +201012345678'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="min-h-[calc(100vh-280px)]">{children}</main>

      {/* Signature Floating Glassmorphism Bottom Dock Navigation */}
      <nav
        aria-label="Quick Navigation Dock"
        className="floating-dock fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-6 md:gap-9 rounded-full px-6 py-2 shadow-2xl transition-all"
      >
        <Link
          href="/"
          aria-label={t('nav.home')}
          className={`flex items-center justify-center transition-all ${
            location === '/'
              ? 'size-10 rounded-full bg-[#4A1525] text-white shadow-sm scale-105'
              : 'size-9 text-foreground/70 hover:text-foreground hover:scale-105'
          }`}
        >
          <HomeIcon className="size-4.5" strokeWidth={1.5} />
        </Link>

        <Link
          href="/shop"
          aria-label={t('nav.shop')}
          className={`relative flex items-center justify-center transition-all ${
            location.startsWith('/shop')
              ? 'size-10 rounded-full bg-[#4A1525] text-white shadow-sm scale-105'
              : 'size-9 text-foreground/70 hover:text-foreground hover:scale-105'
          }`}
        >
          <ShoppingBag className="size-4.5" strokeWidth={1.5} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#D48B88] text-[9px] font-bold text-[#4A1525]">
              {count}
            </span>
          )}
        </Link>

        <button
          type="button"
          aria-label={t('nav.wishlist')}
          onClick={() => setWishlistDrawerOpen(true)}
          className="relative flex size-9 items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 transition-all"
        >
          <Heart
            className={`size-4.5 ${wishlist.length > 0 ? 'fill-[#D48B88] text-[#D48B88]' : ''}`}
            strokeWidth={1.5}
          />
          {wishlist.length > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#4A1525] text-[9px] font-bold text-white">
              {wishlist.length}
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label={t('nav.account')}
          onClick={() => (user ? setUserDrawerOpen(true) : setAuthModalOpen(true))}
          className="flex size-9 items-center justify-center text-foreground/70 hover:text-foreground hover:scale-105 transition-all"
        >
          <User className="size-4.5" strokeWidth={1.5} />
        </button>
      </nav>

      {/* Popups & Drawers */}
      <AuthModal />
      <UserDrawer />
      <WishlistDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Bespoke Luxury Footer */}
      <footer className="mt-20 border-t border-[#EFE8DE] bg-[#F8EBEA]/60">
        <div className="roma-container grid gap-10 py-16 md:grid-cols-4">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <img src="/logo-transparent.png" alt="ROMA" className="h-20 md:h-24 w-auto object-contain drop-shadow-sm" />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('brand.tagline')}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs font-bold text-[#4A1525]">
              <Truck className="size-4 text-[#D48B88]" />
              <span>{isAr ? 'شحن فوري سريع لجميع محافظات مصر' : 'Express Doorstep Delivery Across Egypt'}</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="font-display text-base font-bold text-foreground tracking-wide mb-4">
              {t('section.categories_title')}
            </h4>
            <div className="space-y-2.5 text-sm">
              <Link href="/shop" className="block text-muted-foreground hover:text-[#4A1525] transition">{t('nav.shop')}</Link>
              <Link href="/shop?category=face" className="block text-muted-foreground hover:text-[#4A1525] transition">{t('nav.face')}</Link>
              <Link href="/shop?category=serum" className="block text-muted-foreground hover:text-[#4A1525] transition">{t('nav.serums')}</Link>
              <Link href="/shop?category=skincare" className="block text-muted-foreground hover:text-[#4A1525] transition">{t('nav.skincare')}</Link>
              <Link href="/shop?category=moisturizers" className="block text-muted-foreground hover:text-[#4A1525] transition">{t('nav.moisturizers')}</Link>
              <Link href="/shop?category=lips" className="block text-muted-foreground hover:text-[#4A1525] transition">{t('nav.lips')}</Link>
              <Link href="/shop?category=accessories" className="block text-muted-foreground hover:text-[#4A1525] transition">{t('nav.accessories')}</Link>
            </div>
          </div>

          {/* Col 3: Legal & Customer Policies */}
          <div>
            <h4 className="font-display text-base font-bold text-foreground tracking-wide mb-4">
              {t('nav.policies')}
            </h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <Link href="/policies" className="block hover:text-[#4A1525] transition">
                {isAr ? 'سياسة الاستبدال والاسترجاع (١٤ يوماً)' : '14-Day Returns & Exchanges'}
              </Link>
              <Link href="/policies" className="block hover:text-[#4A1525] transition">
                {isAr ? 'مواعيد وتغطية الشحن السريع' : 'Shipping & Courier Coverage'}
              </Link>
              <Link href="/policies" className="block hover:text-[#4A1525] transition">
                {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection'}
              </Link>
              <Link href="/policies" className="block hover:text-[#4A1525] transition">
                {isAr ? 'الشروط والأحكام الرسمية' : 'Terms & Conditions of Sale'}
              </Link>
              <p className="text-xs text-muted-foreground pt-2">
                {isAr ? 'تواصل معنا واتساب: ' : 'WhatsApp Support: '}
                <strong className="text-foreground font-mono">01012345678</strong>
              </p>
            </div>
          </div>

          {/* Col 4: Newsletter & Payment Badges */}
          <div>
            <h4 className="font-display text-base font-bold text-foreground tracking-wide mb-4">
              {isAr ? 'نادي روما الجمالي الخاص' : 'The ROMA Private Club'}
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground mb-4">
              {isAr
                ? 'اشتركي لتصلكِ الإصدارات الحصرية والخصومات السرية قبل الجميع.'
                : 'Join our inner circle for exclusive previews and private atelier offers.'}
            </p>
            <form
              className="flex rounded-xl border border-border bg-white p-1 shadow-xs focus-within:border-[#D48B88]"
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
                placeholder={newsletterSent ? (isAr ? 'تم الاشتراك بنجاح!' : 'Joined successfully!') : (isAr ? 'بريدك الإلكتروني...' : 'Enter your email...')}
                disabled={newsletterSent}
                className="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#4A1525] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#38101C]"
              >
                {newsletterSent ? (isAr ? 'تم' : 'Subscribed') : (isAr ? 'اشتراك' : 'Join')}
              </button>
            </form>

            {/* Egyptian Payment Badges */}
            <div className="mt-6">
              <p className="text-[11px] text-muted-foreground mb-2">
                {isAr ? 'طرق الدفع المعتمدة في مصر:' : 'Supported Payment Methods:'}
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-muted-foreground">
                <span className="rounded-lg bg-white px-2.5 py-1 border border-border shadow-2xs">فودافون كاش</span>
                <span className="rounded-lg bg-white px-2.5 py-1 border border-border shadow-2xs">إنستاباي InstaPay</span>
                <span className="rounded-lg bg-white px-2.5 py-1 border border-border shadow-2xs">ميزة Meeza</span>
                <span className="rounded-lg bg-white px-2.5 py-1 border border-border shadow-2xs">Visa / Mastercard</span>
                <span className="rounded-lg bg-white px-2.5 py-1 border border-border shadow-2xs">الدفع عند الاستلام (COD)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#EFE8DE] py-5">
          <div className="roma-container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
            <span>© 2026 ROMA Luxury Cosmetics & Accessories · {isAr ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1 text-[#4A1525] font-semibold">
                <ShieldCheck className="size-3.5 text-[#D48B88]" />
                {isAr ? 'حماية مشفرة 256-Bit SSL' : '256-Bit SSL Encrypted'}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-[#4A1525] font-semibold">
                <CheckCircle2 className="size-3.5 text-[#D48B88]" />
                {isAr ? 'مسجل بوزارة الصحة' : 'MOH Egypt Registered'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}