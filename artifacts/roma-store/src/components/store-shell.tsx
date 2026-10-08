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
  Package,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';
import { IntegratedSearch } from '@/components/integrated-search';
import { UserDrawer } from '@/components/user-drawer';
import { WishlistDrawer } from '@/components/wishlist-drawer';
import { SearchModal } from '@/components/search-modal';
import { AuthModal } from '@/components/auth-modal';

export function StoreShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isHomePage = location === '/' || location === '' || location === '/index.html';
  const isProductPage = location.startsWith('/product');
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

  const handleLogoClick = () => {
    try {
      localStorage.removeItem('roma_pending_checkout_step');
      localStorage.removeItem('roma_auth_redirect');
    } catch (_) {}
  };

  const nav = [
    { href: '/', label: t('nav.home') },
    { href: '/shop', label: t('nav.shop') },
    { href: '/categories', label: isAr ? 'الأقسام' : 'Categories' },
    { href: '/shop?category=face', label: t('nav.face') },
    { href: '/shop?category=serum', label: t('nav.serums') },
    { href: '/shop?category=skincare', label: t('nav.skincare') },
    { href: '/shop?category=lips', label: t('nav.lips') },
    { href: '/shop?category=accessories', label: isAr ? 'إكسسوارات' : 'Accessories' },
    { href: '/account', label: isAr ? 'حسابي والطلبات' : 'My Account' },
    { href: '/policies', label: t('nav.policies') },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-[#F9FAFB] flex flex-col" dir={dir}>
      {/* Main Sticky Header */}
      {!isProductPage && (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md transition-all">
        {/* ========================================================================= */}
        {/* MOBILE TOP BAR (< md): Clean, Luxury, Never Overflows Screen Width        */}
        {/* ========================================================================= */}
        <div className="flex md:hidden items-center justify-between h-14 px-4 w-full">
          {/* Brand Logo with Official Transparent Image */}
          <Link
            href="/"
            onClick={handleLogoClick}
            data-testid="link-logo-mobile"
            className="flex items-center gap-1.5 py-0.5 active:scale-95 transition"
          >
            <img
              src="/logo-transparent.png"
              alt="ROMA"
              className="h-10 w-auto max-w-[140px] object-contain drop-shadow-md brightness-110 filter contrast-105"
            />
          </Link>

          {/* Mobile Right Controls: Language + Wishlist + Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Language Toggle on Mobile */}
            <button
              type="button"
              onClick={toggleLang}
              data-testid="button-language-toggle-mobile"
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full border border-white/10 bg-[#141414] text-white hover:border-[#D4A5A5]/50 transition active:scale-95 text-xs font-bold shrink-0"
              title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <span>{isAr ? 'English' : 'العربية'}</span>
              <Globe className="size-3 text-[#D4A5A5]" />
            </button>

            {/* Wishlist Button with Counter */}
            <button
              type="button"
              aria-label={t('nav.wishlist')}
              onClick={() => setWishlistDrawerOpen(true)}
              className="relative flex size-8 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:text-[#F9FAFB] active:scale-95 transition"
            >
              <Heart
                className={`size-3.5 ${wishlist && wishlist.length > 0 ? 'fill-[#D4A5A5] text-[#D4A5A5]' : ''}`}
                strokeWidth={1.75}
              />
              {Boolean(wishlist && wishlist.length > 0) && (
                <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-[#D4A5A5] text-[8px] font-bold text-[#0A0A0A]">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Mobile Top Cart Link */}
            <Link
              href="/cart"
              aria-label={t('nav.cart')}
              className="relative flex size-8 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:text-[#F9FAFB] active:scale-95 transition"
            >
              <ShoppingBag className="size-3.5" strokeWidth={1.75} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-[#D4A5A5] text-[8px] font-bold text-[#0A0A0A] font-mono">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Integrated Mobile Search Bar - Part of the page */}
        <div className="px-4 pb-3 md:hidden w-full">
          <IntegratedSearch variant="mobile" />
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP TOP BAR (>= md): Full Navigation with All Links and Buttons       */}
        {/* ========================================================================= */}
        <div className="hidden md:flex roma-container h-[80px] items-center justify-between gap-4">
          {/* Centered Brand Logo on Desktop */}
          <Link
            href="/"
            onClick={handleLogoClick}
            data-testid="link-logo"
            className="flex items-center gap-2 transition transform hover:scale-105 active:scale-95 py-1"
          >
            <img
              src="/logo-transparent.png"
              alt="ROMA Cosmetics & Jewelry"
              className="h-14 md:h-16 w-auto max-w-[200px] object-contain drop-shadow-md brightness-110 filter contrast-105"
            />
          </Link>

          {/* Desktop Navigation Links: Primary Links & Category Dropdown */}
          <nav className="flex items-center gap-6 text-[13px] font-semibold text-zinc-300">
            <Link
              href="/"
              className={`transition-all hover:text-[#D4A5A5] ${
                location === '/' ? 'font-bold text-[#D4A5A5] border-b-2 border-[#D4A5A5] pb-1' : ''
              }`}
            >
              {t('nav.home')}
            </Link>

            {/* Elegant Dropdown for Categories */}
            <div className="relative group py-2">
              <button
                type="button"
                className={`flex items-center gap-1.5 transition-all hover:text-[#D4A5A5] ${
                  location.includes('category=') || location === '/categories' ? 'font-bold text-[#D4A5A5]' : ''
                }`}
              >
                <span>{isAr ? 'الأقسام' : 'Categories'}</span>
                <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180 text-zinc-400 group-hover:text-[#D4A5A5]" />
              </button>

              <div className="absolute top-full right-0 mt-1 hidden w-52 flex-col rounded-2xl border border-white/10 bg-[#141414]/95 backdrop-blur-xl p-2 shadow-2xl group-hover:flex z-50">
                <Link
                  href="/shop?category=hair-accessories"
                  className="rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-[#D4A5A5] transition flex items-center justify-between"
                >
                  <span>{isAr ? 'إكسسوارات الشعر' : 'Hair Accessories'}</span>
                </Link>
                <Link
                  href="/shop?category=look-accessories"
                  className="rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-[#D4A5A5] transition flex items-center justify-between"
                >
                  <span>{isAr ? 'إكسسوارات الإطلالة' : 'Look Accessories'}</span>
                </Link>
                <Link
                  href="/shop?category=jewelry"
                  className="rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-[#D4A5A5] transition flex items-center justify-between"
                >
                  <span>{isAr ? 'مجوهرات اليد والعنق' : 'Jewelry'}</span>
                </Link>
                <Link
                  href="/shop?category=makeup"
                  className="rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-[#D4A5A5] transition flex items-center justify-between"
                >
                  <span>{isAr ? 'المكياج والجمال' : 'Makeup & Beauty'}</span>
                </Link>
                <Link
                  href="/shop?category=body-care"
                  className="rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-[#D4A5A5] transition flex items-center justify-between"
                >
                  <span>{isAr ? 'العناية بالجسم والنعومة' : 'Body Care & Softness'}</span>
                </Link>
                <Link
                  href="/shop?category=perfumes"
                  className="rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-[#D4A5A5] transition flex items-center justify-between"
                >
                  <span>{isAr ? 'العطور الفاخرة' : 'Luxury Perfumes'}</span>
                </Link>
                <div className="my-1 border-t border-white/10" />
                <Link
                  href="/categories"
                  className="rounded-xl px-3 py-2 text-xs font-bold text-[#D4A5A5] hover:bg-[#D4A5A5]/10 transition"
                >
                  {isAr ? 'عرض كل الأقسام ←' : 'All Categories →'}
                </Link>
              </div>
            </div>
          </nav>

          {/* Integrated Search Bar on Desktop - Native Part of Site UI */}
          <div className="flex-1 max-w-xs xl:max-w-sm mx-2">
            <IntegratedSearch variant="desktop" />
          </div>

          {/* Right section on Desktop: Language + Wishlist + Profile + Cart */}
          <div className="flex items-center gap-2.5">
            {/* Quick Language Toggle beside icons */}
            <button
              type="button"
              onClick={toggleLang}
              data-testid="button-language-toggle"
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-white/10 bg-[#141414] hover:bg-white/5 hover:border-[#D4A5A5]/50 text-white hover:text-[#D4A5A5] transition active:scale-95 text-xs font-bold shadow-xs shrink-0"
              title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <span>{isAr ? 'English' : 'العربية'}</span>
              <Globe className="size-3.5 text-[#D4A5A5]" />
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              aria-label={t('nav.wishlist')}
              data-testid="button-favorites"
              onClick={() => setWishlistDrawerOpen(true)}
              className="relative flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] shadow-xs hover:border-[#D4A5A5] hover:text-[#F9FAFB] transition"
            >
              <Heart
                className={`size-4 ${wishlist && wishlist.length > 0 ? 'fill-[#D4A5A5] text-[#D4A5A5]' : ''}`}
                strokeWidth={1.5}
              />
              {Boolean(wishlist && wishlist.length > 0) && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#D4A5A5] text-[9px] font-bold text-[#0A0A0A] shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* User Profile Avatar / Login Page Link */}
            {user ? (
              <Link
                href="/account"
                aria-label={t('nav.account')}
                data-testid="button-user-profile"
                className="group flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#D4A5A5] p-0.5 transition hover:scale-105 shadow-md shadow-[#D4A5A5]/10"
              >
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              </Link>
            ) : (
              <Link
                href="/auth"
                aria-label={t('nav.login')}
                data-testid="button-login"
                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#F9FAFB] shadow-xs hover:border-[#D4A5A5] hover:text-[#D4A5A5] transition"
              >
                <User className="size-4 text-[#A1A1AA]" strokeWidth={1.5} />
              </Link>
            )}

            {/* Minimalist Luxury Shopping Cart Button */}
            <Link
              href="/cart"
              data-testid="link-cart"
              aria-label={t('nav.cart')}
              className="relative flex size-10 items-center justify-center rounded-full bg-[#1A1A1A] border border-white/10 hover:border-[#D4A5A5]/40 text-white transition shadow-xs hover:text-[#D4A5A5] active:scale-95"
            >
              <ShoppingBag className="size-4" strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#D4A5A5] text-[#0A0A0A] text-[10px] font-bold font-mono">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      )}

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" dir={dir}>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          <div className="relative z-10 flex h-full w-[85%] max-w-sm flex-col bg-[#141414] p-6 shadow-2xl border-x border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <img
                  src="/logo-transparent.png"
                  alt="ROMA"
                  className="h-10 w-auto object-contain drop-shadow"
                />
              </Link>
              <button
                type="button"
                aria-label="Close Menu"
                className="rounded-full p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="py-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-[#A1A1AA]">
                {isAr ? 'لغة المتجر' : 'Store Language'}
              </span>
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-white/10 text-xs font-bold text-white"
              >
                <Globe className="size-3.5 text-[#D4A5A5]" />
                <span>{isAr ? 'English' : 'العربية'}</span>
              </button>
            </div>

            <nav className="flex flex-col gap-2 py-4 text-sm font-semibold">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-2.5 transition ${
                    location === item.href
                      ? 'bg-[#D4A5A5]/15 font-bold text-[#D4A5A5] border border-[#D4A5A5]/20'
                      : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-4 text-xs text-[#A1A1AA] space-y-2">
              <p>📍 {isAr ? 'القاهرة، جمهورية مصر العربية' : 'Cairo, Arab Republic of Egypt'}</p>
              <a
                href="https://wa.me/201505566849"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 font-semibold hover:underline"
              >
                <MessageCircle className="size-3.5" />
                <span>{isAr ? 'خدمة العملاء واتساب: 01505566849' : 'WhatsApp Concierge: +201505566849'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 w-full pb-20 md:pb-12">{children}</main>

      {/* ========================================================================= */}
      {/* 1. BRAND AESTHETICS & MOBILE-FIRST UX: STICKY MOBILE BOTTOM NAVIGATION    */}
      {/* Destinations: [Store / Shop, Categories, Cart with counter, My Account]   */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 shadow-2xl safe-area-pb"
      >
          <div className="grid grid-cols-4 items-center max-w-md mx-auto">
            {/* Destination 1: Home / Store */}
            <Link
              href="/"
              onClick={handleLogoClick}
              aria-label={isAr ? 'الرئيسية' : 'Home'}
              className={`flex flex-col items-center justify-center py-1 transition ${
                location === '/'
                  ? 'text-[#D4A5A5]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-full ${location === '/' ? 'bg-[#D4A5A5]/15' : ''}`}>
                <HomeIcon className="size-5" strokeWidth={1.75} />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">{isAr ? 'المتجر' : 'Shop'}</span>
            </Link>

            {/* Destination 2: Categories */}
            <Link
              href="/categories"
              aria-label={isAr ? 'الأقسام' : 'Categories'}
              className={`flex flex-col items-center justify-center py-1 transition ${
                location === '/categories'
                  ? 'text-[#D4A5A5]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-full ${location === '/categories' ? 'bg-[#D4A5A5]/15' : ''}`}>
                <LayoutGrid className="size-5" strokeWidth={1.75} />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">{isAr ? 'الأقسام' : 'Categories'}</span>
            </Link>

            {/* Destination 3: Cart with Dynamic Counter Badge */}
            <Link
              href="/cart"
              aria-label={isAr ? 'السلة' : 'Cart'}
              className={`relative flex flex-col items-center justify-center py-1 transition ${
                location === '/cart'
                  ? 'text-[#D4A5A5]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <div className={`relative p-1 rounded-full ${location === '/cart' ? 'bg-[#D4A5A5]/15' : ''}`}>
                <ShoppingBag className="size-5" strokeWidth={1.75} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#D4A5A5] text-[9px] font-bold text-[#0A0A0A] font-mono">
                    {count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold mt-0.5">{isAr ? 'السلة' : 'Cart'}</span>
            </Link>

            {/* Destination 4: My Account / Sign In */}
            <Link
              href={user ? '/account' : '/auth?tab=login'}
              aria-label={user ? (isAr ? 'حسابي' : 'Account') : (isAr ? 'تسجيل الدخول' : 'Sign In')}
              className={`flex flex-col items-center justify-center py-1 transition ${
                location === '/account' || location === '/auth' || location === '/login'
                  ? 'text-[#D4A5A5]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-full ${location === '/account' || location === '/auth' || location === '/login' ? 'bg-[#D4A5A5]/15' : ''}`}>
                <User className="size-5" strokeWidth={1.75} />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">
                {user ? (isAr ? 'حسابي' : 'Account') : (isAr ? 'تسجيل الدخول' : 'Sign In')}
              </span>
            </Link>
          </div>
        </nav>

        {/* Popups & Drawers */}
      <UserDrawer />
      <WishlistDrawer />
      <AuthModal />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Bespoke Luxury Dark Footer - Visible on Home Page Only */}
      {isHomePage && (
        <footer className="mt-20 border-t border-white/10 bg-[#0E0E0E]">
        <div className="roma-container grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-10 py-12 md:py-16">
          {/* Col 1: Brand & Identity */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" onClick={handleLogoClick} className="inline-block py-1">
              <img
                src="/logo-transparent.png"
                alt="ROMA Cosmetics & Jewelry"
                className="h-14 md:h-16 w-auto max-w-[200px] object-contain drop-shadow"
              />
            </Link>
            <p className="text-xs leading-relaxed text-zinc-400">
              {t('brand.tagline')}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs font-bold text-[#D4A5A5]">
              <Truck className="size-4 text-[#D4A5A5]" />
              <span>{isAr ? 'شحن فوري لجميع محافظات مصر' : 'Express Delivery Across Egypt'}</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="col-span-1">
            <h4 className="font-display text-sm font-bold text-white tracking-wide mb-3 sm:mb-4">
              {t('section.categories_title')}
            </h4>
            <div className="space-y-2 text-xs">
              <Link href="/shop" className="block text-zinc-400 hover:text-zinc-200 transition">{t('nav.shop')}</Link>
              <Link href="/categories" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'كل الأقسام' : 'All Categories'}</Link>
              <Link href="/shop?category=hair-accessories" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'إكسسوارات الشعر' : 'Hair Accessories'}</Link>
              <Link href="/shop?category=look-accessories" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'إكسسوارات الإطلالة' : 'Look Accessories'}</Link>
              <Link href="/shop?category=jewelry" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'مجوهرات اليد والعنق' : 'Hand & Neck Jewelry'}</Link>
              <Link href="/shop?category=makeup" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'المكياج والجمال' : 'Makeup & Beauty'}</Link>
              <Link href="/shop?category=body-care" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'العناية بالجسم' : 'Body Care'}</Link>
              <Link href="/shop?category=perfumes" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'العطور الفاخرة' : 'Luxury Perfumes'}</Link>
            </div>
          </div>

          {/* Col 3: Legal & Customer Policies */}
          <div className="col-span-1">
            <h4 className="font-display text-sm font-bold text-white tracking-wide mb-3 sm:mb-4">
              {t('nav.policies')}
            </h4>
            <div className="space-y-2 text-xs text-zinc-400">
              <Link href="/policies" className="block hover:text-zinc-200 transition">
                {isAr ? 'الاستبدال والاسترجاع' : 'Returns & Exchanges'}
              </Link>
              <Link href="/policies" className="block hover:text-zinc-200 transition">
                {isAr ? 'مواعيد الشحن والتوصيل' : 'Shipping Info'}
              </Link>
              <Link href="/policies" className="block hover:text-zinc-200 transition">
                {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Link>
              <Link href="/account?tab=orders" className="block hover:text-zinc-200 transition">
                {isAr ? 'تتبع طلباتي' : 'Track Orders'}
              </Link>
              <div className="pt-2">
                <a
                  href="https://wa.me/201505566849"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-emerald-500/30 hover:border-emerald-500/60 text-zinc-300 hover:text-white transition group shadow-sm"
                >
                  <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition shrink-0">
                    <MessageCircle className="size-3.5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-zinc-400 font-medium">
                      {isAr ? 'واتساب' : 'WhatsApp'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 font-mono tracking-wider" dir="ltr">
                      01505566849
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Col 4: Newsletter & Egyptian Payment Badges */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-display text-sm font-bold text-white tracking-wide mb-3 sm:mb-4">
              {isAr ? 'نادي روما الجمالي الخاص' : 'The ROMA Private Club'}
            </h4>
            <p className="text-xs leading-relaxed text-zinc-400 mb-3">
              {isAr
                ? 'اشتركي لتصلكِ الإصدارات الحصرية والخصومات السرية قبل الجميع.'
                : 'Join our inner circle for exclusive previews and private atelier offers.'}
            </p>
            <form
              className="relative flex items-center bg-[#141414] border border-white/10 rounded-xl p-1.5 focus-within:border-[#D4A5A5]/50 transition"
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
                className="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none text-white placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#D4A5A5] px-4 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#C89595] transition shrink-0"
              >
                {newsletterSent ? (isAr ? 'تم' : 'Subscribed') : (isAr ? 'اشتراك' : 'Join')}
              </button>
            </form>

            {/* Egyptian Payment Badges */}
            <div className="mt-4 sm:mt-6">
              <p className="text-[11px] text-zinc-400 mb-2 font-medium">
                {isAr ? 'طرق الدفع المحلية المعتمدة في مصر:' : 'Supported Payment Methods:'}
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-zinc-400">
                <span className="rounded-lg bg-[#141414] px-2.5 py-1 border border-white/10 text-zinc-200">فودافون كاش</span>
                <span className="rounded-lg bg-[#141414] px-2.5 py-1 border border-white/10 text-zinc-200">إنستاباي InstaPay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="border-t border-white/10 py-5 pb-20 md:pb-5">
          <div className="roma-container flex items-center justify-center text-center text-xs text-zinc-400 font-medium">
            <span>© 2026 ROMA Luxury Cosmetics & Accessories · {isAr ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</span>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}