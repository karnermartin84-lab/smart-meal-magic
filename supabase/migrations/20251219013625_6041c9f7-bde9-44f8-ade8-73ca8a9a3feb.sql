-- Create profiles table for user preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  diet_type TEXT DEFAULT 'standard', -- vegan, keto, gluten-free, etc.
  calorie_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carbs_goal INTEGER DEFAULT 250,
  fat_goal INTEGER DEFAULT 65,
  allergies TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create fridge_items table
CREATE TABLE public.fridge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  quantity DECIMAL DEFAULT 1,
  unit TEXT DEFAULT 'serving',
  calories_per_serving DECIMAL DEFAULT 0,
  protein_per_serving DECIMAL DEFAULT 0,
  carbs_per_serving DECIMAL DEFAULT 0,
  fat_per_serving DECIMAL DEFAULT 0,
  serving_size TEXT,
  image_url TEXT,
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_calories DECIMAL DEFAULT 0,
  total_protein DECIMAL DEFAULT 0,
  total_carbs DECIMAL DEFAULT 0,
  total_fat DECIMAL DEFAULT 0,
  servings INTEGER DEFAULT 1,
  meal_type TEXT DEFAULT 'lunch', -- breakfast, lunch, dinner, snack
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create meal_items junction table
CREATE TABLE public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  fridge_item_id UUID REFERENCES public.fridge_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity DECIMAL DEFAULT 1,
  unit TEXT DEFAULT 'serving',
  calories DECIMAL DEFAULT 0,
  protein DECIMAL DEFAULT 0,
  carbs DECIMAL DEFAULT 0,
  fat DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fridge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Fridge items policies
CREATE POLICY "Users can view own fridge items"
  ON public.fridge_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fridge items"
  ON public.fridge_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fridge items"
  ON public.fridge_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fridge items"
  ON public.fridge_items FOR DELETE
  USING (auth.uid() = user_id);

-- Meals policies
CREATE POLICY "Users can view own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- Meal items policies (access through meal ownership)
CREATE POLICY "Users can view own meal items"
  ON public.meal_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = meal_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own meal items"
  ON public.meal_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = meal_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own meal items"
  ON public.meal_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = meal_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own meal items"
  ON public.meal_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = meal_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fridge_items_updated_at
  BEFORE UPDATE ON public.fridge_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();