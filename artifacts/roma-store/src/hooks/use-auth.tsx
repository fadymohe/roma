import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface PaymentMethodItem {
  id: string;
  type: 'instapay' | 'vodafone' | 'card' | 'fawry';
  title: string;
  details?: string;
  isDefault?: boolean;
}

export interface UserOrder {
  id: number | string;
  created_at: string;
  status: string;
  total_amount: number;
  items: any[];
  shipping_address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  city?: string;
  points: number;
  ordersCount: number;
  savedAddresses: string[];
  savedPaymentMethods: PaymentMethodItem[];
}

export const LUXURY_AVATARS = [
  '/avatars/avatar-1.jpg',
  '/avatars/avatar-2.jpg',
  '/avatars/avatar-3.jpg',
  '/avatars/avatar-4.jpg',
];

export function getAccountAvatar(user?: { id?: string; email?: string; phone?: string; avatar?: string } | null): string {
  // If user signed in with Google or avatar is a Google profile photo
  if (user?.avatar) {
    const av = user.avatar.trim();
    if (av.includes('googleusercontent.com') || av.includes('google.com') || av.includes('ggpht.com')) {
      return av;
    }
  }

  // Consistent deterministic pseudo-random index per account/user
  // Using user.id, email, or phone so each account gets its own distinct avatar
  const seedString = (user?.id && user.id.trim()) || (user?.email && user.email.trim().toLowerCase()) || (user?.phone && user.phone.trim()) || (() => {
    try {
      let s = localStorage.getItem('roma_avatar_seed');
      if (!s) {
        s = 'guest_' + Math.floor(Math.random() * 1000000);
        localStorage.setItem('roma_avatar_seed', s);
      }
      return s;
    } catch {
      return 'roma_guest_default';
    }
  })();

  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % LUXURY_AVATARS.length;
  return LUXURY_AVATARS[index];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (customRedirectUrl?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (profile: Partial<User>) => Promise<void>;
  addAddress: (address: string) => Promise<void>;
  removeAddress: (index: number) => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethodItem, 'id'>) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;
  updateUserPoints: (delta: number) => Promise<void>;
  fetchUserOrders: () => Promise<UserOrder[]>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  userDrawerOpen: boolean;
  setUserDrawerOpen: (open: boolean) => void;
  wishlistDrawerOpen: boolean;
  setWishlistDrawerOpen: (open: boolean) => void;
  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'roma_user_session';
const WISHLIST_STORAGE_KEY = 'roma_user_wishlist_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);

  // Sync session on mount with Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserFromSupabase(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUserFromSupabase(session.user);
      } else if (!session && user && !localStorage.getItem(AUTH_STORAGE_KEY)) {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper to construct User object from Supabase Auth User
  const syncUserFromSupabase = (sbUser: any) => {
    const meta = sbUser.user_metadata || {};
    const nameFromEmail = sbUser.email ? sbUser.email.split('@')[0] : 'عميل روما';
    const formattedName =
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      (nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
    const isGoogle = sbUser.app_metadata?.provider === 'google' || sbUser.identities?.some((id: any) => id.provider === 'google');
    const rawAvatar = meta.avatar_url || meta.picture || sbUser.identities?.[0]?.identity_data?.avatar_url || sbUser.identities?.[0]?.identity_data?.picture || '';
    const resolvedAvatar = (isGoogle && rawAvatar) ? rawAvatar : getAccountAvatar({ id: sbUser.id, email: sbUser.email, phone: meta.phone, avatar: rawAvatar });

    const updatedUser: User = {
      id: sbUser.id,
      name: formattedName,
      email: sbUser.email || '',
      phone: meta.phone || sbUser.phone || '',
      avatar: resolvedAvatar,
      city: meta.city || '',
      points: Number(meta.points ?? 50),
      ordersCount: Number(meta.ordersCount ?? 0),
      savedAddresses: Array.isArray(meta.savedAddresses) ? meta.savedAddresses : [],
      savedPaymentMethods: Array.isArray(meta.savedPaymentMethods) ? meta.savedPaymentMethods : [
        { id: 'pm_insta', type: 'instapay', title: 'إنستاباي (InstaPay)', isDefault: true },
        { id: 'pm_voda', type: 'vodafone', title: 'فودافون كاش والمحافظ الإلكترونية' },
      ],
    };

    setUser(updatedUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (_) {}
  };

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (_) {}
  }, [wishlist]);

  // Login handler with Supabase Auth
  const login = async (email: string, password = 'Password123!') => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // If credentials invalid or email not confirmed, provide helpful feedback
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'يرجى تأكيد بريدك الإلكتروني أو تفعيل الحساب' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        syncUserFromSupabase(data.user);
        setAuthModalOpen(false);
        return { success: true };
      }

      return { success: false, error: 'لم يتم العثور على الحساب' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  // Register handler with Supabase Auth
  const register = async (name: string, email: string, phone?: string, password = 'Password123!') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name,
            phone: phone || '',
            points: 50, // Welcome loyalty bonus points
            ordersCount: 0,
            savedAddresses: [],
            savedPaymentMethods: [
              { id: 'pm_insta', type: 'instapay', title: 'إنستاباي (InstaPay)', isDefault: true },
            ],
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول' };
        }
        if (error.message.includes('rate limit')) {
          // If free tier email rate limit reached, create local active session gracefully
          const fallbackUser: User = {
            id: 'usr_' + Date.now(),
            name,
            email,
            phone: phone || '',
            points: 50,
            ordersCount: 0,
            savedAddresses: [],
            savedPaymentMethods: [
              { id: 'pm_insta', type: 'instapay', title: 'إنستاباي (InstaPay)', isDefault: true },
            ],
          };
          setUser(fallbackUser);
          setAuthModalOpen(false);
          return { success: true };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        syncUserFromSupabase(data.user);
        setAuthModalOpen(false);
        return { success: true };
      }

      return { success: false, error: 'حدث خطأ في إنشاء الحساب' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'حدث خطأ أثناء إنشاء الحساب' };
    }
  };

  // Google OAuth sign-in handler with automatic redirect to Google and callback to given url or /cart?step=payment
  const loginWithGoogle = async (customRedirectUrl?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = customRedirectUrl || `${window.location.origin}/cart?step=payment`;
      try {
        localStorage.setItem('roma_auth_redirect', redirectUrl);
      } catch (_) {}
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.warn('Google Auth OAuth note:', error.message);
        return { success: false, error: error.message };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل تسجيل الدخول عبر Google' };
    }
  };

  // Logout handler
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserDrawerOpen(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'فشل إرسال الرابط' };
    }
  };

  const updateUserProfile = async (profile: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...profile };
    setUser(updated);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  // Add saved address
  const addAddress = async (address: string) => {
    if (!address.trim() || !user) return;
    const clean = address.trim();
    const existing = Array.isArray(user.savedAddresses) ? user.savedAddresses : [];
    const newAddresses = [clean, ...existing.filter((a) => a !== clean)];
    const updated = { ...user, savedAddresses: newAddresses };
    setUser(updated);

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    // Save to Supabase Auth metadata
    try {
      await supabase.auth.updateUser({
        data: { savedAddresses: newAddresses },
      });
    } catch (_) {}
  };

  // Remove saved address
  const removeAddress = async (index: number) => {
    if (!user) return;
    const existing = Array.isArray(user.savedAddresses) ? user.savedAddresses : [];
    const newAddresses = existing.filter((_, i) => i !== index);
    const updated = { ...user, savedAddresses: newAddresses };
    setUser(updated);

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    try {
      await supabase.auth.updateUser({
        data: { savedAddresses: newAddresses },
      });
    } catch (_) {}
  };

  // Add payment method
  const addPaymentMethod = async (method: Omit<PaymentMethodItem, 'id'>) => {
    if (!user) return;
    const newItem: PaymentMethodItem = {
      ...method,
      id: 'pm_' + Date.now(),
    };
    const newMethods = [newItem, ...user.savedPaymentMethods];
    const updated = { ...user, savedPaymentMethods: newMethods };
    setUser(updated);

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    try {
      await supabase.auth.updateUser({
        data: { savedPaymentMethods: newMethods },
      });
    } catch (_) {}
  };

  // Remove payment method
  const removePaymentMethod = async (id: string) => {
    if (!user) return;
    const newMethods = user.savedPaymentMethods.filter((m) => m.id !== id);
    const updated = { ...user, savedPaymentMethods: newMethods };
    setUser(updated);

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    try {
      await supabase.auth.updateUser({
        data: { savedPaymentMethods: newMethods },
      });
    } catch (_) {}
  };

  // Award or deduct points
  const updateUserPoints = async (delta: number) => {
    if (!user) return;
    const newPoints = Math.max(0, user.points + delta);
    const newOrdersCount = delta > 0 ? user.ordersCount + 1 : user.ordersCount;
    const updated = { ...user, points: newPoints, ordersCount: newOrdersCount };
    setUser(updated);

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    try {
      await supabase.auth.updateUser({
        data: { points: newPoints, ordersCount: newOrdersCount },
      });
    } catch (_) {}
  };

  // Fetch real order history from Supabase with instant local fallback
  const fetchUserOrders = async (): Promise<UserOrder[]> => {
    let localRecent: UserOrder[] = [];
    try {
      const saved = localStorage.getItem('roma_recent_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) localRecent = parsed;
      }
    } catch (_) {}

    if (!user) {
      // For guest visitors, return their locally saved orders immediately
      return localRecent;
    }

    try {
      // 1. Fetch by user_id
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let combined: UserOrder[] = [];
      if (!error && Array.isArray(data)) {
        combined = [...data];
      }

      // 2. Fallback to searching by phone if user_id returns empty
      if (combined.length === 0 && user.phone && user.phone.length > 8) {
        try {
          const cleanPhone = user.phone.replace(/\D+/g, '');
          const res = await fetch(`/api/track-order?phone=${encodeURIComponent(cleanPhone)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.orders)) {
              combined = [...json.orders];
            }
          }
        } catch (_) {}
      }

      // Merge only recent orders from local storage that strictly belong to this logged-in user
      const existingIds = new Set(
        combined.map((o: any) => String(o.order_number || o.id))
      );
      const userCleanPhone = (user.phone || '').replace(/\D+/g, '');
      const userEmail = (user.email || '').toLowerCase().trim();

      for (const rec of localRecent) {
        const recKey = String((rec as any).order_number || rec.id);
        const recPhone = String((rec as any).phone || (rec as any).customer_phone || '').replace(/\D+/g, '');
        const recEmail = String((rec as any).email || (rec as any).customer_email || '').toLowerCase().trim();
        const recUserId = (rec as any).user_id;

        const isBelonging =
          (recUserId && recUserId === user.id) ||
          (userCleanPhone && recPhone && (recPhone === userCleanPhone || (userCleanPhone.length >= 8 && recPhone.endsWith(userCleanPhone.slice(-8))))) ||
          (userEmail && recEmail && recEmail === userEmail);

        if (isBelonging && !existingIds.has(recKey)) {
          combined.unshift(rec);
          existingIds.add(recKey);
        }
      }

      return combined;
    } catch (e) {
      console.warn('Could not fetch user orders:', e);
      if (!user) return localRecent;
      const userCleanPhone = (user.phone || '').replace(/\D+/g, '');
      const userEmail = (user.email || '').toLowerCase().trim();
      return localRecent.filter((rec: any) => {
        const recPhone = String(rec.phone || rec.customer_phone || '').replace(/\D+/g, '');
        const recEmail = String(rec.email || rec.customer_email || '').toLowerCase().trim();
        const recUserId = rec.user_id;
        return (
          (recUserId && recUserId === user.id) ||
          (userCleanPhone && recPhone && (recPhone === userCleanPhone || (userCleanPhone.length >= 8 && recPhone.endsWith(userCleanPhone.slice(-8))))) ||
          (userEmail && recEmail && recEmail === userEmail)
        );
      });
    }
  };

  // Wishlist toggle
  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isWishlisted = (productId: number) => wishlist.includes(productId);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        updateUserProfile,
        addAddress,
        removeAddress,
        addPaymentMethod,
        removePaymentMethod,
        updateUserPoints,
        fetchUserOrders,
        authModalOpen,
        setAuthModalOpen,
        userDrawerOpen,
        setUserDrawerOpen,
        wishlistDrawerOpen,
        setWishlistDrawerOpen,
        wishlist,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
