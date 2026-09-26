import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface PaymentMethodItem {
  id: string;
  type: 'cod' | 'vodafone' | 'card' | 'fawry';
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
  points: number;
  ordersCount: number;
  savedAddresses: string[];
  savedPaymentMethods: PaymentMethodItem[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
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
const WISHLIST_STORAGE_KEY = 'roma_user_wishlist';

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
      return saved ? JSON.parse(saved) : [1, 3];
    } catch {
      return [1, 3];
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
    const formattedName = meta.name || (nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));

    const updatedUser: User = {
      id: sbUser.id,
      name: formattedName,
      email: sbUser.email || '',
      phone: meta.phone || sbUser.phone || '',
      points: Number(meta.points ?? 50),
      ordersCount: Number(meta.ordersCount ?? 0),
      savedAddresses: Array.isArray(meta.savedAddresses) ? meta.savedAddresses : [],
      savedPaymentMethods: Array.isArray(meta.savedPaymentMethods) ? meta.savedPaymentMethods : [
        { id: 'pm_cod', type: 'cod', title: 'الدفع عند الاستلام', isDefault: true },
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
              { id: 'pm_cod', type: 'cod', title: 'الدفع عند الاستلام', isDefault: true },
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
              { id: 'pm_cod', type: 'cod', title: 'الدفع عند الاستلام', isDefault: true },
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

  // Add saved address
  const addAddress = async (address: string) => {
    if (!address.trim() || !user) return;
    const clean = address.trim();
    if (user.savedAddresses.includes(clean)) return;

    const newAddresses = [clean, ...user.savedAddresses];
    const updated = { ...user, savedAddresses: newAddresses };
    setUser(updated);

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
    const newAddresses = user.savedAddresses.filter((_, i) => i !== index);
    const updated = { ...user, savedAddresses: newAddresses };
    setUser(updated);

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
      await supabase.auth.updateUser({
        data: { points: newPoints, ordersCount: newOrdersCount },
      });
    } catch (_) {}
  };

  // Fetch real order history from Supabase
  const fetchUserOrders = async (): Promise<UserOrder[]> => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${user.id},customer_name.eq.${user.name}`)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('Could not fetch user orders:', e);
    }
    return [];
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
        register,
        logout,
        resetPassword,
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
