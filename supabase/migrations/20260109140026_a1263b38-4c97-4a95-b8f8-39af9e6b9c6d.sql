-- Create pantry_items table for long-term staples
CREATE TABLE public.pantry_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'unit',
  calories_per_serving NUMERIC DEFAULT 0,
  protein_per_serving NUMERIC DEFAULT 0,
  carbs_per_serving NUMERIC DEFAULT 0,
  fat_per_serving NUMERIC DEFAULT 0,
  serving_size TEXT DEFAULT '100g',
  category TEXT DEFAULT 'other',
  barcode TEXT,
  brand TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own pantry items" 
ON public.pantry_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pantry items" 
ON public.pantry_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pantry items" 
ON public.pantry_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pantry items" 
ON public.pantry_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pantry_items_updated_at
BEFORE UPDATE ON public.pantry_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create chat_messages table for AI Chef conversations
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  meal_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
ON public.chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);