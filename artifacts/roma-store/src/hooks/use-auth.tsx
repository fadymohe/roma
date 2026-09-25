import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  points: number;
  ordersCount: number;
  savedAddresses?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, phone?: string, password?: string) => Promise<boolean>;
  logout: () => void;
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
      return saved ? JSON.parse(saved) : [1, 3]; // Default popular items
    } catch {
      return [1, 3];
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  const login = async (email: string, _password?: string) => {
    // In a production app this calls the auth API. Here we simulate instant secure authentication.
    const nameFromEmail = email.split('@')[0];
    const formattedName = nameFromEmail ? nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) : 'عميل مميز';
    const loggedUser: User = {
      id: 'usr_' + Date.now(),
      name: formattedName,
      email,
      phone: '+20 10 1234 5678',
      points: 85,
      ordersCount: 2,
      savedAddresses: ['القاهرة — التجمع الخامس', 'الجيزة — الشيخ زايد'],
    };
    setUser(loggedUser);
    setAuthModalOpen(false);
    return true;
  };

  const register = async (name: string, email: string, phone?: string, _password?: string) => {
    const newUser: User = {
      id: 'usr_' + Date.now(),
      name,
      email,
      phone: phone || '+20 10 0000 0000',
      points: 50, // 50 Welcome bonus points
      ordersCount: 0,
      savedAddresses: [],
    };
    setUser(newUser);
    setAuthModalOpen(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setUserDrawerOpen(false);
  };

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
