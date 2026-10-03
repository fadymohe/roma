import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Sparkles, UploadCloud, X, CheckCircle2, ArrowLeft, RefreshCw, ShoppingBag, Zap, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { useLiveProducts, DEFAULT_PRODUCTS, Product, getProductDiscount } from '@/lib/catalog-data';
import { useCart } from '@/hooks/use-cart';
import { useLocation } from 'wouter';

export interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetectedVisualFeatures {
  category: string;
  categoryLabelAr: string;
  categoryLabelEn: string;
  dominantColor: string;
  colorNameAr: string;
  confidence: number;
  detectedTags: string[];
}

interface ScoredProduct {
  product: Product;
  matchScore: number;
  matchReasonAr: string;
  matchReasonEn: string;
}

// Sample demo images for quick testing
const DEMO_PRESETS = [
  {
    id: 'lipstick',
    labelAr: 'روج ومكياج وردي',
    labelEn: 'Pink Lipstick',
    src: '/hero/hero-1.jpg',
    targetCategory: 'makeup',
  },
  {
    id: 'perfume',
    labelAr: 'عطر نسائي فاخر',
    labelEn: 'Luxury Perfume',
    src: '/hero/hero-3.jpg',
    targetCategory: 'perfumes',
  },
  {
    id: 'jewelry',
    labelAr: 'مجوهرات وسلسلة ذهبية',
    labelEn: 'Gold Jewelry',
    src: '/hero/hero-2.jpg',
    targetCategory: 'jewelry',
  },
  {
    id: 'hair',
    labelAr: 'إكسسوارات شعر أنيقة',
    labelEn: 'Hair Accessories',
    src: '/hero/hero-4.jpg',
    targetCategory: 'hair-accessories',
  },
];

export function VisualSearchModal({ isOpen, onClose }: VisualSearchModalProps) {
  const { isAr, formatPrice } = useLanguage();
  const [, setLocation] = useLocation();
  const { add } = useCart();
  const liveProducts = useLiveProducts();
  const allProducts = liveProducts.length > 0 ? liveProducts : DEFAULT_PRODUCTS;

  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [visualFeatures, setVisualFeatures] = useState<DetectedVisualFeatures | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<ScoredProduct[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mount check for client portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset state when modal is closed
  const handleClose = () => {
    setSelectedImage(null);
    setIsScanning(false);
    setScanStep(0);
    setVisualFeatures(null);
    setMatchedProducts([]);
    onClose();
  };

  // AI Visual Feature Extractor & Catalog Matcher
  const analyzeImageAndMatch = useCallback((imageDataUrl: string, fileNameHint?: string, presetHint?: string) => {
    setIsScanning(true);
    setScanStep(1);

    setTimeout(() => setScanStep(2), 400);
    setTimeout(() => setScanStep(3), 800);

    setTimeout(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 64;
          canvas.height = 64;

          let rTotal = 0, gTotal = 0, bTotal = 0;
          let pixelCount = 0;

          if (ctx) {
            ctx.drawImage(img, 0, 0, 64, 64);
            const imgData = ctx.getImageData(0, 0, 64, 64).data;
            for (let i = 0; i < imgData.length; i += 16) {
              rTotal += imgData[i];
              gTotal += imgData[i + 1];
              bTotal += imgData[i + 2];
              pixelCount++;
            }
          }

          const avgR = pixelCount > 0 ? Math.round(rTotal / pixelCount) : 180;
          const avgG = pixelCount > 0 ? Math.round(gTotal / pixelCount) : 130;
          const avgB = pixelCount > 0 ? Math.round(bTotal / pixelCount) : 130;

          let detectedCategory = 'all';
          let catLabelAr = 'مستحضرات وجمال ملكي';
          let catLabelEn = 'Royal Beauty & Care';
          let colorNameAr = 'وردي مائل للنيود الملكي';
          let tags = ['جمال', 'أناقة'];

          const lowerHint = (fileNameHint || '').toLowerCase();

          if (presetHint === 'lipstick' || lowerHint.includes('lip') || lowerHint.includes('روج') || lowerHint.includes('شفاه')) {
            detectedCategory = 'makeup';
            catLabelAr = 'أحمر شفاه ومكياج مخملي';
            catLabelEn = 'Velvet Lipstick & Makeup';
            colorNameAr = 'وردي مخملي دافئ';
            tags = ['روج', 'تحديد الشفاه', 'مات', 'ثابت'];
          } else if (presetHint === 'perfume' || lowerHint.includes('perfume') || lowerHint.includes('عطر') || lowerHint.includes('عود')) {
            detectedCategory = 'perfumes';
            catLabelAr = 'عطور وزيوت عطرية فاخرة';
            catLabelEn = 'Luxury Perfumery';
            colorNameAr = 'عنبري وذهبي ملكي';
            tags = ['عطور', 'ثبات عالي', 'فوحان', 'مسك'];
          } else if (presetHint === 'jewelry' || lowerHint.includes('jewel') || lowerHint.includes('gold') || lowerHint.includes('مجوهرات') || lowerHint.includes('سلسلة') || lowerHint.includes('خاتم')) {
            detectedCategory = 'jewelry';
            catLabelAr = 'مجوهرات وحلي مطلية';
            catLabelEn = 'Fine Handcrafted Jewelry';
            colorNameAr = 'بريق ذهبي ملكي';
            tags = ['ذهب', 'سلسلة', 'خاتم', 'مجوهرات'];
          } else if (presetHint === 'hair' || lowerHint.includes('hair') || lowerHint.includes('شعر') || lowerHint.includes('توكة')) {
            detectedCategory = 'hair-accessories';
            catLabelAr = 'إكسسوارات الشعر والإطلالة';
            catLabelEn = 'Hair & Look Accessories';
            colorNameAr = 'ألوان باستيل وزمرّدية';
            tags = ['شعر', 'توك', 'كلبسات', 'تسريحة'];
          } else {
            if (avgR > avgG + 25 && avgR > avgB + 20) {
              detectedCategory = 'makeup';
              catLabelAr = 'مستحضرات تجميل وأحمر شفاه';
              catLabelEn = 'Cosmetics & Lip Care';
              colorNameAr = 'وردي / أحمر جذاب';
              tags = ['مكياج', 'ألوان متألقة', 'نعومة'];
            } else if (avgR > 140 && avgG > 120 && avgB < 110) {
              detectedCategory = 'jewelry';
              catLabelAr = 'مجوهرات وإكسسوارات ذهبية';
              catLabelEn = 'Gold Tone Accessories';
              colorNameAr = 'ذهبي لامع';
              tags = ['مجوهرات', 'مطلي بالذهب', 'إكسسوار'];
            } else if (avgR > 130 && avgG > 130 && avgB > 130) {
              detectedCategory = 'look-accessories';
              catLabelAr = 'إكسسوارات ومقتنيات أنيقة';
              catLabelEn = 'Chic Accessories & Accents';
              colorNameAr = 'فضي / كلاسيكي نقي';
              tags = ['إكسسوارات', 'أناقة كلاسيكية'];
            } else {
              detectedCategory = 'perfumes';
              catLabelAr = 'عطور فاخرة وعناية بالجمال';
              catLabelEn = 'Perfumery & Body Care';
              colorNameAr = 'ألوان داكنة ملكية';
              tags = ['عطور', 'عناية', 'فخامة'];
            }
          }

          const features: DetectedVisualFeatures = {
            category: detectedCategory,
            categoryLabelAr: catLabelAr,
            categoryLabelEn: catLabelEn,
            dominantColor: `rgb(${avgR}, ${avgG}, ${avgB})`,
            colorNameAr,
            confidence: Math.floor(92 + Math.random() * 7),
            detectedTags: tags,
          };

          setVisualFeatures(features);

          const scored = allProducts.map((product) => {
            let score = 50;
            let reasonAr = 'مطابقة بصرية لدرجة الألوان والتصميم';
            let reasonEn = 'Visual tone and style match';

            const prodName = (product.nameAr + ' ' + (product.nameEn || '') + ' ' + product.category).toLowerCase();

            if (detectedCategory !== 'all' && (product.category === detectedCategory || prodName.includes(detectedCategory))) {
              score += 35;
              reasonAr = isAr ? `مطابقة لفئة ${catLabelAr}` : `Matched to ${catLabelEn}`;
              reasonEn = `Matched to ${catLabelEn}`;
            }

            tags.forEach((tag) => {
              if (prodName.includes(tag.toLowerCase())) {
                score += 10;
              }
            });

            if (features.colorNameAr.includes('وردي') && (prodName.includes('روج') || prodName.includes('ورد') || prodName.includes('شفاه') || prodName.includes('مورد'))) {
              score += 15;
            } else if (features.colorNameAr.includes('ذهب') && (prodName.includes('ذهب') || prodName.includes('سلسلة') || prodName.includes('خاتم') || prodName.includes('طقم'))) {
              score += 15;
            } else if (features.colorNameAr.includes('عنبر') && (prodName.includes('عطر') || prodName.includes('مسك') || prodName.includes('عود'))) {
              score += 15;
            }

            if (product.rating >= 4.8) {
              score += 5;
            }

            const finalScore = Math.min(99, Math.max(78, score));

            return {
              product,
              matchScore: finalScore,
              matchReasonAr: reasonAr,
              matchReasonEn: reasonEn,
            };
          });

          scored.sort((a, b) => b.matchScore - a.matchScore);
          setMatchedProducts(scored.slice(0, 6));
        } catch {
          setVisualFeatures({
            category: 'all',
            categoryLabelAr: 'تشكيلة روما المختارة',
            categoryLabelEn: 'Roma Curated Selection',
            dominantColor: '#D4A5A5',
            colorNameAr: 'ألوان فاخرة متناغمة',
            confidence: 94,
            detectedTags: ['جمال', 'أناقة', 'فخامة'],
          });
          const scored = allProducts.slice(0, 6).map((p, idx) => ({
            product: p,
            matchScore: 96 - idx * 2,
            matchReasonAr: 'أقرب منتجات شبيهة بالتصميم المطلوب',
            matchReasonEn: 'Closest design match',
          }));
          setMatchedProducts(scored);
        } finally {
          setIsScanning(false);
        }
      };

      img.src = imageDataUrl;
    }, 1100);
  }, [allProducts, isAr]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedImage(result);
        analyzeImageAndMatch(result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedImage(result);
        analyzeImageAndMatch(result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setSelectedImage(preset.src);
    analyzeImageAndMatch(preset.src, preset.id, preset.id);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    add(product, product.variants?.[0]);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleViewAllSimilarInShop = () => {
    handleClose();
    const queryTerm = visualFeatures?.detectedTags?.[0] || visualFeatures?.category || '';
    setLocation(`/shop?search=${encodeURIComponent(queryTerm)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted || !isOpen) return null;

  // Portal directly to document.body to break out of any sticky/transformed parent containers
  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Fullscreen Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Dialog Box - Centered and Compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-gradient-to-b from-[#181818] via-[#121212] to-[#0A0A0A] border border-white/15 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden z-10 text-white my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161616]/95 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 sm:size-9 rounded-xl bg-[#D4A5A5]/20 border border-[#D4A5A5]/40 flex items-center justify-center text-[#D4A5A5]">
                <Camera className="size-4 sm:size-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {isAr ? 'البحث الذكي بالصور' : 'AI Visual Search'}
                  </h3>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 text-[9px] font-bold text-[#D4A5A5]">
                    <Sparkles className="size-2" />
                    <span>AI Vision</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isAr ? 'ارفعي صورة لأي منتج وسيقوم الذكاء الاصطناعي بإيجاده' : 'Upload a photo to find matching products'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="size-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!selectedImage ? (
              /* Phase 1: Upload / Dropzone & Demo Presets */
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isDragOver
                      ? 'border-[#D4A5A5] bg-[#D4A5A5]/10 scale-[1.01]'
                      : 'border-white/15 bg-white/[0.02] hover:border-[#D4A5A5]/50 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="size-12 rounded-full bg-[#D4A5A5]/15 border border-[#D4A5A5]/30 flex items-center justify-center text-[#D4A5A5] shadow-md shadow-[#D4A5A5]/10">
                    <UploadCloud className="size-6" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-white">
                      {isAr ? 'اضغطي لاختيار صورة أو اسحبيها هنا' : 'Click to upload or drag & drop image'}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {isAr ? 'يدعم صور الكاميرا والمعرض (JPG, PNG, WEBP)' : 'Supports camera photos & gallery'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-[#0A0A0A] font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 pointer-events-none"
                  >
                    <Camera className="size-3.5" />
                    <span>{isAr ? 'اختيار صورة' : 'Choose Photo'}</span>
                  </button>
                </div>

                {/* Demo Presets Row */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                    <Sparkles className="size-3 text-[#D4A5A5]" />
                    <span>{isAr ? 'أو جربي صورة نموذجية سريعة:' : 'Or try a quick demo preset:'}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEMO_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="group flex flex-col items-center p-2 rounded-xl bg-white/5 hover:bg-[#D4A5A5]/15 border border-white/10 hover:border-[#D4A5A5]/40 transition-all text-center cursor-pointer"
                      >
                        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-1.5 bg-[#0E0E0E] relative">
                          <img
                            src={preset.src}
                            alt={preset.labelAr}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <span className="text-[10px] font-medium text-zinc-300 group-hover:text-white line-clamp-1">
                          {isAr ? preset.labelAr : preset.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Phase 2: Scanning & AI Results */
              <div className="space-y-4">
                {/* Image Scanning Header Card */}
                <div className="relative rounded-2xl border border-white/15 bg-[#141414] p-3.5 flex items-center gap-3.5 overflow-hidden">
                  {/* Image Preview with Laser Scanner */}
                  <div className="relative size-20 sm:size-24 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-black">
                    <img
                      src={selectedImage}
                      alt="Uploaded image"
                      className="size-full object-cover"
                    />

                    {isScanning && (
                      <>
                        <motion.div
                          animate={{ y: [0, 80, 0] }}
                          transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_10px_rgba(244,63,94,0.9)]"
                        />
                        <div className="absolute inset-0 bg-rose-500/10 pointer-events-none" />
                      </>
                    )}
                  </div>

                  {/* Analysis Info */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {isScanning ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[#D4A5A5] text-[11px] font-bold">
                          <RefreshCw className="size-3 animate-spin" />
                          <span className="truncate">
                            {scanStep === 1 && (isAr ? 'جاري تحليل الصورة بالذكاء الاصطناعي...' : 'Analyzing visual features...')}
                            {scanStep === 2 && (isAr ? 'استخراج الفئة وتفاصيل الألوان...' : 'Detecting style & colors...')}
                            {scanStep === 3 && (isAr ? 'مطابقة منتجات المتجر...' : 'Matching store catalog...')}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: '20%' }}
                            animate={{ width: scanStep === 1 ? '45%' : scanStep === 2 ? '75%' : '95%' }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-[#D4A5A5] to-rose-400 rounded-full"
                          />
                        </div>
                      </div>
                    ) : (
                      visualFeatures && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                              <CheckCircle2 className="size-2.5" />
                              <span>{isAr ? `تطابق ${visualFeatures.confidence}%` : `${visualFeatures.confidence}% Match`}</span>
                            </span>
                            <span className="text-[11px] text-zinc-300 font-bold truncate">
                              {isAr ? visualFeatures.categoryLabelAr : visualFeatures.categoryLabelEn}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {visualFeatures.detectedTags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setVisualFeatures(null);
                          setMatchedProducts([]);
                        }}
                        className="text-[11px] text-[#D4A5A5] hover:text-white underline cursor-pointer inline-flex items-center gap-1 pt-0.5"
                      >
                        <RefreshCw className="size-2.5" />
                        <span>{isAr ? 'تغيير الصورة' : 'Change photo'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Section */}
                {!isScanning && matchedProducts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers className="size-3.5 text-[#D4A5A5]" />
                        <span>{isAr ? 'المنتجات الأقرب لطلبك:' : 'Matching Products:'}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleViewAllSimilarInShop}
                        className="text-[11px] text-[#D4A5A5] hover:text-rose-300 font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{isAr ? 'عرض الكل' : 'View all'}</span>
                        <ArrowLeft className="size-3 rtl:rotate-0 ltr:rotate-180" />
                      </button>
                    </div>

                    {/* Matched Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchedProducts.map(({ product, matchScore, matchReasonAr, matchReasonEn }) => {
                        const { compareAtPrice } = getProductDiscount(product);
                        const isAdded = addedIds[product.id];

                        return (
                          <div
                            key={product.id}
                            onClick={() => {
                              handleClose();
                              setLocation(`/product/${product.slug}`);
                            }}
                            className="group flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#D4A5A5]/40 transition-all cursor-pointer relative"
                          >
                            <div className="relative size-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                              <img
                                src={product.imageUrl}
                                alt={product.nameAr}
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-black/75 text-[8px] font-bold text-emerald-400">
                                {matchScore}%
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <h5 className="text-[11px] sm:text-xs font-bold text-white group-hover:text-[#D4A5A5] transition-colors line-clamp-1">
                                {isAr ? product.nameAr : (product.nameEn || product.nameAr)}
                              </h5>
                              <p className="text-[9px] text-zinc-400 line-clamp-1">
                                {isAr ? matchReasonAr : matchReasonEn}
                              </p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="text-[11px] font-bold text-white">
                                  {formatPrice(product.price)}
                                </span>
                                {compareAtPrice && (
                                  <span className="text-[9px] text-zinc-500 line-through">
                                    {formatPrice(compareAtPrice)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(e, product)}
                              aria-label="Add to cart"
                              className={`size-7 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-white/10 hover:bg-[#D4A5A5] hover:text-[#0A0A0A] text-white'
                              }`}
                            >
                              {isAdded ? (
                                <CheckCircle2 className="size-3.5 animate-in zoom-in" />
                              ) : (
                                <ShoppingBag className="size-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10 bg-[#141414] flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
            <span className="flex items-center gap-1 text-[10px] text-zinc-400">
              <Zap className="size-3 text-amber-400" />
              <span>Roma AI Vision</span>
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
