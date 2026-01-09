-- Create meal_plan table for scheduled meals
CREATE TABLE public.meal_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_date, slot)
);

-- Enable RLS
ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own meal plans"
ON public.meal_plan FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
ON public.meal_plan FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
ON public.meal_plan FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
ON public.meal_plan FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_meal_plan_updated_at
BEFORE UPDATE ON public.meal_plan
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();