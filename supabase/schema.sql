-- ==============================================================================
-- ROMA LUXURY BEAUTY & COSMETICS STORE
-- PRODUCTION SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean teardown if needed (for fresh setup)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- ==============================================================================
-- 3. PROFILES TABLE (Linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  address_line TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  loyalty_points INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles linked 1:1 with auth.users with admin privilege flags and address defaults.';

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatic profile creation trigger upon user registration in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, city, address_line, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Cairo'),
    COALESCE(NEW.raw_user_meta_data->>'address_line', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PRODUCTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(10, 2) CHECK (discount_price IS NULL OR discount_price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 1,
  badge_ar TEXT,
  badge_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. CARTS & CART_ITEMS TABLES (For Active & Abandoned Cart Recovery)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovery_email_sent_at TIMESTAMPTZ,
  coupon_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatic trigger to touch carts.last_activity_at whenever cart_items are modified
CREATE OR REPLACE FUNCTION public.touch_cart_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.carts
    SET last_activity_at = NOW()
    WHERE id = OLD.cart_id;
    RETURN OLD;
  ELSE
    UPDATE public.carts
    SET last_activity_at = NOW()
    WHERE id = NEW.cart_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_cart_item_change ON public.cart_items;
CREATE TRIGGER on_cart_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_cart_activity();

-- ==============================================================================
-- 7. ORDERS & ORDER_ITEMS TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  coupon_used TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL 
    CHECK (payment_method IN ('cod', 'vodafone_cash', 'instapay', 'fawry')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'paid', 'verified')),
  payment_reference TEXT,
  payment_receipt_url TEXT,
  shipping_details JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant_info TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 8.1 PROFILES POLICIES
CREATE POLICY "Users can view own profile or admins view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- 8.2 CATEGORIES POLICIES
CREATE POLICY "Public read active categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins or service role manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- 8.3 PRODUCTS POLICIES
CREATE POLICY "Public read products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins or service role manage products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- 8.4 CARTS POLICIES
CREATE POLICY "Users access own cart or guest by session"
  ON public.carts FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin() OR auth.role() = 'anon');

CREATE POLICY "Users insert/update own cart"
  ON public.carts FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid() OR auth.role() = 'anon');

CREATE POLICY "Users update own cart"
  ON public.carts FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin() OR auth.role() = 'anon');

-- 8.5 CART ITEMS POLICIES
CREATE POLICY "Users access cart items"
  ON public.cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR public.is_admin() OR auth.role() = 'anon')
    )
  );

CREATE POLICY "Users modify cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR public.is_admin() OR auth.role() = 'anon')
    )
  );

-- 8.6 ORDERS POLICIES
CREATE POLICY "Users can view own orders or admin view all"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Customers can place orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admin or backend service role updates order status"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- 8.7 ORDER ITEMS POLICIES
CREATE POLICY "Users view items of their orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Order items insert allowed on order placement"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- Enable Realtime publication for orders so the Telegram bot receives instant inserts!
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ==============================================================================
-- 9. INITIAL SEED DATA (ROMA LUXURY CATEGORIES & COSMETICS)
-- ==============================================================================
INSERT INTO public.categories (id, name_ar, name_en, slug, image_url, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'الوجه ومكياج البشرة', 'Face & Skin Cosmetics', 'face', 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85', 1),
  ('c1000000-0000-0000-0000-000000000002', 'سيرومات النضارة والإشراق', 'Luminous Glow Serums', 'serum', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85', 2),
  ('c1000000-0000-0000-0000-000000000003', 'العناية بالبشرة والترطيب', 'Hydration & Skincare', 'skincare', 'https://images.unsplash.com/photo-1608248597359-59754f15d706?auto=format&fit=crop&w=800&q=85', 3),
  ('c1000000-0000-0000-0000-000000000004', 'أحمر الشفاه والعناية بها', 'Velvet Lips & Gloss', 'lips', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=85', 4),
  ('c1000000-0000-0000-0000-000000000005', 'إكسسوارات نسائية فاخرة', 'Luxury Accessories', 'accessories', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
  id, category_id, name_ar, name_en, description_ar, description_en,
  price, discount_price, stock, images, is_featured, rating, review_count, badge_ar, badge_en
)
VALUES
  (
    'p1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'كريم استعادة نضارة وترطيب الوجه المخملي — Roma Velvet Recovery Cream',
    'Roma Velvet Face Recovery & Hydration Cream',
    'تركيبة فاخرة غنية بمستخلصات الزهور النادرة وحمض الهيالورونيك الثلاثي، تمنح البشرة ترطيباً مخملياً عميقاً ونضارة أثيرية تدوم طوال اليوم دون أي ملمس دهني.',
    'A luxurious velvety restorative formulation enriched with botanical extracts and triple hyaluronic acid for deep hydration and luminous glow.',
    195.00, 165.00, 48,
    ARRAY[
      'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=90',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=90',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=90'
    ],
    TRUE, 4.95, 384, 'الأكثر طلباً', 'Best Seller'
  ),
  (
    'p1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'سيروم الذهب الوردي وإشراقة النياسيناميد — Roma Rose Gold Glow Serum',
    'Roma Rose Gold Niacinamide Radiance Serum',
    'سيروم مركز بنسبة 10% نياسيناميد وزينك نقي لتنظيم الدهون، تقليص المسام، وإعادة الحيوية والإشراقة إلى لون البشرة الطبيعي.',
    'Concentrated with 10% pure niacinamide and zinc to refine pores, even skin tone, and unlock natural radiance.',
    175.00, 145.00, 32,
    ARRAY[
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=90',
      'https://images.unsplash.com/photo-1608248597359-59754f15d706?auto=format&fit=crop&w=1000&q=90'
    ],
    TRUE, 5.0, 290, 'إصدار حصري', 'Limited Edition'
  ),
  (
    'p1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000004',
    'أحمر شفاه كشميري مطفأ — Roma Cashmere Matte Lipstick',
    'Roma Cashmere Matte Velvet Lipstick',
    'لون غني يدوم حتى 16 ساعة مع لمسة نهائية مخملية ومستخلصات زبدة الشيا وزيت اللوز لترطيب فائق ونعومة حريرية لا تجف.',
    'Rich long-wearing velvet matte lipstick infused with shea butter and sweet almond oil for luscious, non-drying lips.',
    130.00, 110.00, 65,
    ARRAY[
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=90',
      'https://images.unsplash.com/photo-1599732289344-38495548370b?auto=format&fit=crop&w=1000&q=90'
    ],
    TRUE, 4.9, 192, 'مفضل لدى المشاهير', 'Celebrity Choice'
  ),
  (
    'p1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000005',
    'قلادة روز جولد بلمسة اللؤلؤ الإيطالي — Roma Pearl Rose Gold Choker',
    'Roma Italian Pearl & Rose Gold Choker Necklace',
    'قطعة إكسسوار راقية مطلية بالذهب الوردي عيار 18 مع حبات اللؤلؤ الطبيعي، مصممة لإبراز فخامة إطلالتك في كل مناسبة.',
    '18k rose gold plated handcrafted necklace embellished with freshwater pearls for an exquisite luxury statement.',
    280.00, 240.00, 18,
    ARRAY[
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=90',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=90'
    ],
    TRUE, 5.0, 85, 'قطعة نادرة', 'Atelier Piece'
  )
ON CONFLICT (id) DO NOTHING;
