import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingContextType {
  showLoader: (message?: string, durationMs?: number) => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType>({
  showLoader: () => {},
  isLoading: false,
});

export function useLuxuryLoader() {
  return useContext(LoadingContext);
}

export function LuxuryLoaderProvider({ children }: { children: ReactNode }) {
  // Show for 500ms on initial site opening as requested by user
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const showLoader = (customMsg = '', durationMs = 500) => {
    setMessage(customMsg);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setMessage('');
    }, durationMs);
  };

  return (
    <LoadingContext.Provider value={{ showLoader, isLoading }}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="luxury-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0A] select-none cursor-wait overflow-hidden"
          >
            {/* Ambient Background Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,165,165,0.15)_0%,transparent_65%)] pointer-events-none" />

            {/* Glowing Brand Content Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 flex flex-col items-center text-center px-4"
            >
              {/* Brand Logo with Pulsing Halo */}
              <div className="relative mb-6 flex items-center justify-center">
                <div className="absolute size-28 sm:size-32 rounded-full bg-[#D4A5A5]/10 animate-ping opacity-75" />
                <div className="absolute size-24 sm:size-28 rounded-full border border-[#D4A5A5]/30 animate-spin [animation-duration:3s]" />
                
                <img
                  src="/logo-transparent.png"
                  alt="ROMA"
                  className="relative z-10 h-14 sm:h-16 w-auto max-w-[190px] object-contain drop-shadow-[0_4px_24px_rgba(212,165,165,0.4)]"
                />
              </div>

              {/* Title & Brand Slogan */}
              <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-widest text-white uppercase flex items-center gap-2">
                <span>ROMA</span>
                <span className="size-1 rounded-full bg-[#D4A5A5]" />
                <span className="text-xs font-sans text-[#D4A5A5] font-semibold tracking-normal">
                  عالم الجمال والفخامة
                </span>
              </h2>

              {/* Custom action message if provided (e.g. during purchase) */}
              {message ? (
                <p className="mt-3 text-xs sm:text-sm text-[#D4A5A5] font-medium flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="size-3.5 text-[#D4A5A5]" />
                  <span>{message}</span>
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-zinc-400 font-sans tracking-wide">
                  تحضير التجربة الملكية...
                </p>
              )}

              {/* Slim Luxury Progress Line */}
              <div className="mt-5 w-36 sm:w-48 h-0.5 bg-white/10 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }}
                  className="w-full h-full bg-gradient-to-r from-transparent via-[#D4A5A5] to-transparent shadow-[0_0_8px_#D4A5A5]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}
