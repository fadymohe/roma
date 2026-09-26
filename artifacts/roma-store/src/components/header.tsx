'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Search,
  ShoppingBag,
  Heart,
  User,
  MessageCircle,
  Truck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  Clock,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/language-context';

export interface HeaderProps {
  onOpenSearch?: () => void;
  whatsappNumber?: string;
}

export function Header({
  onOpenSearch,
  whatsappNumber = '201012345678',
}: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location] = useLocation();
  const { count } = useCart();
  const { wishlist, setWishlistDrawerOpen, setAuthModalOpen, user, setUserDrawerOpen } = useAuth();
  const { isAr, t, toggleLang } = useLanguage();

  const categories = [
    { name: isAr ? 'الكل' : 'All Products', href: '/shop' },
    { name: isAr ? 'مستحضرات الوجه' : 'Face Makeup', href: '/shop?category=face' },
    { name: isAr ? 'سيرومات النضارة' : 'Radiance Serums', href: '/shop?category=serum' },
    { name: isAr ? 'العناية بالبشرة' : 'Skin Care', href: '/shop?category=skincare' },
    { name: isAr ? 'الترطيب الفائق' : 'Moisturizers', href: '/shop?category=moisturizers' },
    { name: isAr ? 'أحمر الشفاه والقلوس' : 'Lips & Gloss', href: '/shop?category=lips' },
    { name: isAr ? 'إكسسوارات فاخرة' : 'Accessories', href: '/shop?category=accessories' },
    { name: isAr ? 'سياسات المتجر' : 'Store Policies', href: '/policies' },
  ];

  const whatsappMessage = encodeURIComponent(
    isAr
      ? 'مرحباً ROMA، أود الاستفسار عن منتجاتكم وطلب مساعدة في الاختيار 🌸'
      : 'Hello ROMA, I would like to inquire about your products 🌸'
  );

  return (
    <>
      {/* 1. Top Bar: Luxury Marquee Banner */}
      <aside
        aria-label={isAr ? 'شريط الإعلانات' : 'Announcement Bar'}
        className="w-full bg-[#5A1827] text-white text-[12px] font-medium tracking-wide py-2 px-4 shadow-sm border-b border-[#8A4F58]/30 select-none overflow-hidden relative z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Marquee message */}
          <div className="flex-1 flex items-center justify-center gap-2 text-center overflow-hidden">
            <span className="inline-block animate-pulse text-[#E06D53]">
              <Sparkles className="size-3.5 inline ml-1" strokeWidth={1.75} />
            </span>
            <p className="truncate font-sans font-medium text-[11px] sm:text-[12px]">
              {isAr
                ? 'شحن مجاني لكافة محافظات مصر للطلبات فوق 500 ج.م 🚚 | الدفع عند الاستلام متاح'
                : 'Free Shipping Across Egypt for orders over 500 EGP 🚚 | Cash on Delivery Available'}
            </p>
          </div>

          {/* Quick Language Toggle */}
          <button
            type="button"
            onClick={toggleLang}
            aria-label="Switch Language"
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white border border-white/20 shrink-0"
          >
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Sticky Header */}
      <header
        role="banner"
        className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#ECE3E1] transition-shadow duration-300"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[72px] sm:h-[80px] flex items-center justify-between gap-2 sm:gap-4">
          {/* RIGHT (in RTL): Menu Drawer Trigger + Search Button */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Hamburger Menu - 48x48px hit area */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={isAr ? 'فتح القائمة الرئيسية' : 'Open Main Navigation Menu'}
              aria-expanded={drawerOpen}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full text-[#1F1618] hover:bg-[#F5EBEB] active:scale-95 transition-transform duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#5A1827]"
            >
              <Menu className="size-6 text-[#5A1827]" strokeWidth={1.75} />
            </button>

            {/* Search Trigger - 48x48px hit area */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label={isAr ? 'بحث عن المنتجات' : 'Search products'}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full text-[#1F1618] hover:bg-[#F5EBEB] active:scale-95 transition-transform duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#5A1827]"
            >
              <Search className="size-5 text-[#5A1827]" strokeWidth={1.75} />
            </button>

            {/* Wishlist Button - Desktop only shortcut */}
            <button
              type="button"
              onClick={() => setWishlistDrawerOpen(true)}
              aria-label={isAr ? 'قائمة الرغبات' : 'Wishlist'}
              className="hidden md:flex min-w-[48px] min-h-[48px] items-center justify-center rounded-full text-[#1F1618] hover:bg-[#F5EBEB] active:scale-95 transition-transform duration-150 relative"
            >
              <Heart
                className={`size-5 ${
                  wishlist.length > 0 ? 'fill-[#E06D53] text-[#E06D53]' : 'text-[#5A1827]'
                }`}
                strokeWidth={1.75}
              />
              {wishlist.length > 0 && (
                <span className="absolute top-2 left-2 flex size-4 items-center justify-center rounded-full bg-[#E06D53] text-[10px] font-bold text-white shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>
          </div>

          {/* CENTER: Wordmark Logo "ROMA" */}
          <div className="flex-1 flex items-center justify-center">
            <Link
              href="/"
              aria-label="ROMA - الصفحة الرئيسية"
              className="group flex flex-col items-center justify-center py-1 select-none transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-serif tracking-widest text-2xl sm:text-3xl font-extrabold text-[#5A1827] uppercase">
                  ROMA
                </span>
              </div>
              <span className="text-[9px] tracking-[0.25em] uppercase text-[#8A4F58] font-sans font-semibold">
                {isAr ? 'مستحضرات وجمال' : 'Luxury Beauty'}
              </span>
            </Link>
          </div>

          {/* LEFT (in RTL): WhatsApp Chat Button + Cart Button with Badge */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* WhatsApp Direct Chat Button - 48x48px hit area */}
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isAr ? 'تواصل عبر واتساب' : 'Chat via WhatsApp'}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full text-[#1B6B4A] hover:bg-[#E8F5EE] active:scale-95 transition-transform duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1B6B4A]"
            >
              <MessageCircle className="size-5.5 text-[#1B6B4A]" strokeWidth={1.75} />
            </a>

            {/* User Account Button - 48x48px hit area */}
            <button
              type="button"
              onClick={() => (user ? setUserDrawerOpen(true) : setAuthModalOpen(true))}
              aria-label={isAr ? 'حسابي' : 'My Account'}
              className="hidden sm:flex min-w-[48px] min-h-[48px] items-center justify-center rounded-full text-[#1F1618] hover:bg-[#F5EBEB] active:scale-95 transition-transform duration-150"
            >
              <User className="size-5 text-[#5A1827]" strokeWidth={1.75} />
            </button>

            {/* Cart Button with Dynamic Badge - 48x48px hit area */}
            <Link
              href="/cart"
              aria-label={
                isAr
                  ? `عربة التسوق، ${count} منتج`
                  : `Shopping Bag, ${count} items`
              }
              className="relative min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-[#5A1827] text-white hover:bg-[#3E0F1A] active:scale-95 transition-all shadow-md shadow-[#5A1827]/15 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E06D53]"
            >
              <ShoppingBag className="size-5 text-white" strokeWidth={1.75} />
              {count > 0 && (
                <span
                  data-testid="cart-badge-count"
                  className="absolute -top-1 -right-1 flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-[#E06D53] text-[11px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in-50"
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop Category Bar (Quick Nav) */}
        <nav
          aria-label={isAr ? 'أقسام المتجر' : 'Store Categories'}
          className="hidden lg:flex items-center justify-center gap-6 py-2.5 px-6 border-t border-[#ECE3E1]/70 bg-white/70"
        >
          {categories.slice(0, 7).map((cat) => {
            const isActive = location === cat.href;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className={`text-[13px] font-semibold tracking-wide transition-colors duration-150 py-1 border-b-2 ${
                  isActive
                    ? 'text-[#5A1827] border-[#5A1827] font-bold'
                    : 'text-[#6B5E62] border-transparent hover:text-[#5A1827] hover:border-[#8A4F58]'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* 3. Full-Screen / Slide-Over Category Drawer with Framer Motion */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide Drawer: Originating from right in RTL, left in LTR */}
            <motion.aside
              initial={{ x: isAr ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-sm sm:max-w-md h-full bg-[#FAF8F5] shadow-2xl flex flex-col justify-between overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label={isAr ? 'قائمة التصنيفات' : 'Navigation Menu'}
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#ECE3E1] flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-2xl font-extrabold text-[#5A1827]">
                    ROMA
                  </span>
                  <span className="text-[10px] text-[#8A4F58] font-bold px-2 py-0.5 rounded-full bg-[#F5EBEB]">
                    {isAr ? 'المتجر الرسمي' : 'Official Store'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label={isAr ? 'إغلاق القائمة' : 'Close Menu'}
                  className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full text-[#6B5E62] hover:bg-[#F5EBEB] hover:text-[#5A1827] active:scale-90 transition-all"
                >
                  <X className="size-6" strokeWidth={1.75} />
                </button>
              </div>

              {/* Categories Navigation Links */}
              <div className="p-5 space-y-1.5 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A4F58] mb-3 px-3">
                  {isAr ? 'تصفحي حسب الفئات' : 'Browse Categories'}
                </p>

                {categories.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl text-[14px] font-semibold text-[#1F1618] hover:bg-white hover:text-[#5A1827] hover:shadow-xs active:bg-[#F5EBEB] transition-all group"
                  >
                    <span>{cat.name}</span>
                    {isAr ? (
                      <ChevronLeft className="size-4 text-[#8A4F58] group-hover:translate-x-[-3px] transition-transform" />
                    ) : (
                      <ChevronRight className="size-4 text-[#8A4F58] group-hover:translate-x-[3px] transition-transform" />
                    )}
                  </Link>
                ))}

                {/* Trust Highlights Inside Drawer */}
                <div className="mt-6 pt-5 border-t border-[#ECE3E1] space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-[#ECE3E1]">
                    <Truck className="size-5 text-[#E06D53]" strokeWidth={1.75} />
                    <div>
                      <p className="text-xs font-bold text-[#1F1618]">
                        {isAr ? 'شحن سريع لكافة محافظات مصر' : 'Express Egypt Delivery'}
                      </p>
                      <p className="text-[11px] text-[#6B5E62]">
                        {isAr ? 'خلال 24-48 ساعة داخل القاهرة والجيزة' : '24-48h in Cairo & Giza'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-[#ECE3E1]">
                    <ShieldCheck className="size-5 text-[#1B6B4A]" strokeWidth={1.75} />
                    <div>
                      <p className="text-xs font-bold text-[#1F1618]">
                        {isAr ? 'منتجات أصلية 100% ومضمونة' : '100% Authentic & Safe'}
                      </p>
                      <p className="text-[11px] text-[#6B5E62]">
                        {isAr ? 'خاضعة لمعايير الرقابة الصحية المصرية' : 'Egyptian Health Compliant'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-[#ECE3E1] bg-white space-y-3">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#1B6B4A] hover:bg-[#145239] text-white font-bold text-sm shadow-md transition-colors"
                >
                  <MessageCircle className="size-5" />
                  <span>{isAr ? 'مساعدة فورية عبر واتساب' : 'Chat on WhatsApp'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    toggleLang();
                    setDrawerOpen(false);
                  }}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-[#ECE3E1] text-[#1F1618] hover:bg-[#FAF8F5] font-semibold text-xs transition-colors"
                >
                  <span>{isAr ? 'English Language' : 'اللغة العربية'}</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
export default Header;
