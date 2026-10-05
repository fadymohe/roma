import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Shop from '@/pages/shop';
import CategoriesPage from '@/pages/categories';
import ProductPage from '@/pages/product';
import CartPage from '@/pages/cart';
import AccountPage from '@/pages/account';
import PoliciesPage from '@/pages/policies';
import AuthPage from '@/pages/auth';
import { CartProvider } from '@/hooks/use-cart';
import { LanguageProvider } from '@/lib/language-context';
import { AuthProvider } from '@/hooks/use-auth';
import { LuxuryLoaderProvider } from '@/components/luxury-loader';
import { StoreShell } from '@/components/store-shell';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location]);
  return null;
}

function CategoryRedirect({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(`/shop?category=${encodeURIComponent(slug)}`, { replace: true });
  }, [slug, setLocation]);
  return null;
}

function AuthRedirectHandler() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    try {
      const pendingStep = localStorage.getItem('roma_pending_checkout_step');
      const authRedirect = localStorage.getItem('roma_auth_redirect');

      // Intercept returns to homepage when checkout/payment step or specific redirect was pending
      if (location === '/' || location === '') {
        if (
          pendingStep === 'payment' ||
          authRedirect?.includes('cart') ||
          authRedirect?.includes('checkout') ||
          authRedirect?.includes('payment')
        ) {
          setLocation('/cart?step=payment', { replace: true });
          return;
        }

        if (authRedirect && authRedirect !== '/') {
          localStorage.removeItem('roma_auth_redirect');
          setLocation(authRedirect, { replace: true });
          return;
        }
      }
    } catch (_) {}
  }, [location, setLocation]);

  return null;
}

function Router() {
  return (
    <StoreShell>
      <ScrollToTop />
      <AuthRedirectHandler />
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/categories" component={CategoriesPage} />
          <Route path="/category" component={CategoriesPage} />
          <Route path="/category/:slug">
            {(params) => <CategoryRedirect slug={params.slug} />}
          </Route>
          <Route path="/categories/:slug">
            {(params) => <CategoryRedirect slug={params.slug} />}
          </Route>
          <Route path="/product/:slug" component={ProductPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/cart/payment" component={CartPage} />
          <Route path="/checkout" component={CartPage} />
          <Route path="/checkout/payment" component={CartPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/login" component={AuthPage} />
          <Route path="/register" component={AuthPage} />
          <Route path="/policies" component={PoliciesPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </StoreShell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <LuxuryLoaderProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </LuxuryLoaderProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
