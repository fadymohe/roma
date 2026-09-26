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
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-[#F9FAFB] pb-24 md:pb-12" dir={dir}>
      {/* Top Luxury Announcement Bar - Pitch Charcoal & Rose Gold */}
      <div className="bg-[#121212] text-[#F9FAFB] px-3 py-1.5 text-center text-[10px] sm:text-[12px] font-medium tracking-wide border-b border-white/5">
        <div className="roma-container flex items-center justify-between md:justify-center gap-2">
          <div className="flex items-center gap-1.5 mx-auto">
            <Sparkles className="size-3 text-[#D4A5A5] animate-pulse shrink-0" />
            <span className="text-[#A1A1AA] truncate">
              {t('common.free_shipping_notice')}{' '}
              <strong className="rounded-full bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 px-1.5 py-0.5 font-mono text-[#D4A5A5] text-[10px]">
                ROMA10 (-10%)
              </strong>
            </span>
          </div>

          {/* Quick Language Toggle in Top Bar for Desktop */}
          <button
            type="button"
            onClick={toggleLang}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white border border-white/10 transition shrink-0"
            title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="size-3 text-[#D4A5A5]" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md transition-all">
        {/* ========================================================================= */}
        {/* MOBILE TOP BAR (< md): Clean, Luxury, Never Overflows Screen Width        */}
        {/* ========================================================================= */}
        <div className="flex md:hidden items-center justify-between h-14 px-4 w-full">
          {/* Brand Logo with Official Transparent Image */}
          <Link
            href="/"
            data-testid="link-logo-mobile"
            className="flex items-center gap-1.5 py-0.5 active:scale-95 transition"
          >
            <img
              src="/logo-transparent.png"
              alt="ROMA"
              className="h-10 w-auto max-w-[140px] object-contain drop-shadow-md brightness-110 filter contrast-105"
            />
          </Link>

          {/* Mobile Right Controls: Language Switch + Search + Wishlist */}
          <div className="flex items-center gap-1.5">
            {/* Quick Language Switch */}
            <button
              type="button"
              onClick={toggleLang}
              aria-label="Toggle Language"
              className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-white/10 bg-[#141414] text-[11px] font-bold text-white hover:border-[#D4A5A5] active:scale-95 transition"
            >
              <Globe className="size-3 text-[#D4A5A5]" strokeWidth={1.5} />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Circular Search Button */}
            <button
              type="button"
              aria-label={t('nav.search_placeholder')}
              onClick={() => setSearchOpen(true)}
              className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:text-[#F9FAFB] active:scale-95 transition"
            >
              <Search className="size-3.5" strokeWidth={1.75} />
            </button>

            {/* Wishlist Button with Counter */}
            <button
              type="button"
              aria-label={t('nav.wishlist')}
              onClick={() => setWishlistDrawerOpen(true)}
              className="relative flex size-8 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] hover:text-[#F9FAFB] active:scale-95 transition"
            >
              <Heart
                className={`size-3.5 ${wishlist.length > 0 ? 'fill-[#D4A5A5] text-[#D4A5A5]' : ''}`}
                strokeWidth={1.75}
              />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-[#D4A5A5] text-[8px] font-bold text-[#0A0A0A]">
                  {wishlist.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP TOP BAR (>= md): Full Navigation with All Links and Buttons       */}
        {/* ========================================================================= */}
        <div className="hidden md:flex roma-container h-[80px] items-center justify-between gap-4">
          {/* Centered Brand Logo on Desktop */}
          <Link
            href="/"
            data-testid="link-logo"
            className="flex items-center gap-2 transition transform hover:scale-105 active:scale-95 py-1"
          >
            <img
              src="/logo-transparent.png"
              alt="ROMA Cosmetics & Jewelry"
              className="h-14 md:h-16 w-auto max-w-[200px] object-contain drop-shadow-md brightness-110 filter contrast-105"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="flex items-center gap-5 text-[13px] font-semibold text-[#A1A1AA]">
            {nav.slice(0, 6).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-all hover:text-[#D4A5A5] ${
                  location === item.href ? 'font-bold text-[#D4A5A5] border-b-2 border-[#D4A5A5] pb-1' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right section on Desktop: Language + Search + Wishlist + Cart + Profile */}
          <div className="flex items-center gap-2.5">
            {/* Language Switch */}
            <button
              type="button"
              onClick={toggleLang}
              aria-label="Toggle Language"
              className="flex items-center gap-1.5 h-10 px-3 rounded-full border border-white/10 bg-[#141414] text-xs font-bold text-white hover:border-[#D4A5A5] hover:bg-white/5 transition shadow-xs"
            >
              <Globe className="size-3.5 text-[#D4A5A5]" strokeWidth={1.5} />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Circular Search Button */}
            <button
              type="button"
              aria-label={t('nav.search_placeholder')}
              data-testid="link-search"
              onClick={() => setSearchOpen(true)}
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#A1A1AA] shadow-xs hover:border-[#D4A5A5] hover:text-[#F9FAFB] transition"
            >
              <Search className="size-4" strokeWidth={1.5} />
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
                className={`size-4 ${wishlist.length > 0 ? 'fill-[#D4A5A5] text-[#D4A5A5]' : ''}`}
                strokeWidth={1.5}
              />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#D4A5A5] text-[9px] font-bold text-[#0A0A0A] shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* User Profile Avatar / Login */}
            {user ? (
              <Link
                href="/account"
                aria-label={t('nav.account')}
                data-testid="button-user-profile"
                className="group flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#D4A5A5] p-0.5 transition hover:scale-105 shadow-md shadow-[#D4A5A5]/10"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              </Link>
            ) : (
              <button
                type="button"
                aria-label={t('nav.login')}
                data-testid="button-login"
                onClick={() => setAuthModalOpen(true)}
                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-[#F9FAFB] shadow-xs hover:border-[#D4A5A5] hover:text-[#D4A5A5] transition"
              >
                <User className="size-4 text-[#A1A1AA]" strokeWidth={1.5} />
              </button>
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
              <p>📞 {isAr ? 'خدمة العملاء واتساب: 01012345678' : 'WhatsApp Concierge: +201012345678'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="min-h-[calc(100vh-280px)]">{children}</main>

      {/* ========================================================================= */}
      {/* 1. BRAND AESTHETICS & MOBILE-FIRST UX: STICKY MOBILE BOTTOM NAVIGATION    */}
      {/* Destinations: [Store / Shop, Categories, Cart with counter, My Account]   */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. BRAND AESTHETICS & MOBILE-FIRST UX: STICKY MOBILE BOTTOM NAVIGATION    */}
      {/* Destinations: [Store / Shop, Categories, Cart with counter, My Account]   */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 shadow-2xl safe-area-pb"
      >
        <div className="grid grid-cols-4 items-center max-w-md mx-auto">
          {/* Destination 1: Store / Shop */}
          <Link
            href="/shop"
            aria-label={isAr ? 'المتجر' : 'Shop'}
            className={`flex flex-col items-center justify-center py-1 transition ${
              location === '/shop' || location === '/'
                ? 'text-[#D4A5A5]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-full ${location === '/shop' || location === '/' ? 'bg-[#D4A5A5]/15' : ''}`}>
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

          {/* Destination 4: My Account */}
          <Link
            href="/account"
            aria-label={isAr ? 'حسابي' : 'Account'}
            className={`flex flex-col items-center justify-center py-1 transition ${
              location === '/account'
                ? 'text-[#D4A5A5]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-full ${location === '/account' ? 'bg-[#D4A5A5]/15' : ''}`}>
              <User className="size-5" strokeWidth={1.75} />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">{isAr ? 'حسابي' : 'Account'}</span>
          </Link>
        </div>
      </nav>

      {/* Popups & Drawers */}
      <AuthModal />
      <UserDrawer />
      <WishlistDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Bespoke Luxury Dark Footer */}
      <footer className="mt-20 border-t border-white/10 bg-[#0E0E0E]">
        <div className="roma-container grid gap-10 py-16 md:grid-cols-4">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block py-1">
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
          <div>
            <h4 className="font-display text-sm font-bold text-white tracking-wide mb-4">
              {t('section.categories_title')}
            </h4>
            <div className="space-y-2.5 text-xs">
              <Link href="/shop" className="block text-zinc-400 hover:text-zinc-200 transition">{t('nav.shop')}</Link>
              <Link href="/categories" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'كل الأقسام' : 'All Categories'}</Link>
              <Link href="/shop?category=face" className="block text-zinc-400 hover:text-zinc-200 transition">{t('nav.face')}</Link>
              <Link href="/shop?category=serum" className="block text-zinc-400 hover:text-zinc-200 transition">{t('nav.serums')}</Link>
              <Link href="/shop?category=skincare" className="block text-zinc-400 hover:text-zinc-200 transition">{t('nav.skincare')}</Link>
              <Link href="/shop?category=lips" className="block text-zinc-400 hover:text-zinc-200 transition">{t('nav.lips')}</Link>
              <Link href="/shop?category=accessories" className="block text-zinc-400 hover:text-zinc-200 transition">{isAr ? 'إكسسوارات' : 'Accessories'}</Link>
            </div>
          </div>

          {/* Col 3: Legal & Customer Policies */}
          <div>
            <h4 className="font-display text-sm font-bold text-white tracking-wide mb-4">
              {t('nav.policies')}
            </h4>
            <div className="space-y-2.5 text-xs text-zinc-400">
              <Link href="/policies" className="block hover:text-zinc-200 transition">
                {isAr ? 'سياسة الاستبدال والاسترجاع (١٤ يوماً)' : '14-Day Returns & Exchanges'}
              </Link>
              <Link href="/policies" className="block hover:text-zinc-200 transition">
                {isAr ? 'مواعيد وتغطية الشحن السريع' : 'Shipping & Courier Coverage'}
              </Link>
              <Link href="/policies" className="block hover:text-zinc-200 transition">
                {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection'}
              </Link>
              <Link href="/account" className="block hover:text-zinc-200 transition">
                {isAr ? 'متابعة وتتبع طلباتي' : 'Track My Orders'}
              </Link>
              <p className="text-[11px] text-zinc-400 pt-2">
                {isAr ? 'تواصل معنا واتساب: ' : 'WhatsApp Concierge: '}
                <strong className="text-white font-mono">01012345678</strong>
              </p>
            </div>
          </div>

          {/* Col 4: Newsletter & Egyptian Payment Badges */}
          <div>
            <h4 className="font-display text-sm font-bold text-white tracking-wide mb-4">
              {isAr ? 'نادي روما الجمالي الخاص' : 'The ROMA Private Club'}
            </h4>
            <p className="text-xs leading-relaxed text-zinc-400 mb-4">
              {isAr
                ? 'اشتركي لتصلكِ الإصدارات الحصرية والخصومات السرية قبل الجميع.'
                : 'Join our inner circle for exclusive previews and private atelier offers.'}
            </p>
            <form
              className="relative flex items-center bg-[#161616] border border-white/10 rounded-xl overflow-hidden p-1 focus-within:border-[#D4A5A5]/60 transition"
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
                className="rounded-lg bg-[#D4A5A5] px-4 py-2 text-xs font-bold text-[#0A0A0A] hover:bg-[#C89595] transition shrink-0"
              >
                {newsletterSent ? (isAr ? 'تم' : 'Subscribed') : (isAr ? 'اشتراك' : 'Join')}
              </button>
            </form>

            {/* Egyptian Payment Badges */}
            <div className="mt-6">
              <p className="text-[11px] text-zinc-400 mb-2 font-medium">
                {isAr ? 'طرق الدفع المحلية المعتمدة في مصر:' : 'Supported Payment Methods:'}
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-zinc-400">
                <span className="rounded-lg bg-[#141414] px-2.5 py-1 border border-white/10 text-zinc-200">فودافون كاش</span>
                <span className="rounded-lg bg-[#141414] px-2.5 py-1 border border-white/10 text-zinc-200">إنستاباي InstaPay</span>
                <span className="rounded-lg bg-[#141414] px-2.5 py-1 border border-white/10 text-zinc-200">فوري Fawry</span>
                <span className="rounded-lg bg-[#141414] px-2.5 py-1 border border-white/10 text-zinc-200">الدفع عند الاستلام (COD)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="border-t border-white/10 py-5">
          <div className="roma-container flex flex-col items-center justify-between gap-3 text-xs text-zinc-400 md:flex-row">
            <span>© 2026 ROMA Luxury Cosmetics & Accessories · {isAr ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1 text-[#D4A5A5] font-semibold">
                <ShieldCheck className="size-3.5 text-[#D4A5A5]" />
                {isAr ? 'دفع آمن وتشفير SSL' : '256-Bit SSL Encrypted'}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-[#D4A5A5] font-semibold">
                <CheckCircle2 className="size-3.5 text-[#D4A5A5]" />
                {isAr ? 'منتجات أصلية 100%' : '100% Authentic Luxury'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}