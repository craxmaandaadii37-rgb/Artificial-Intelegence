-- Handle existing NULL user_id records and add proper RLS policies

-- First, delete any existing conversations with NULL user_id (since we can't assign them to anyone)
DELETE FROM public.conversations WHERE user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE public.conversations 
  ALTER COLUMN user_id SET NOT NULL;

-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Anyone can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can delete conversations" ON public.conversations;

-- Create user-scoped RLS policies for conversations
CREATE POLICY "Users can view own conversations" 
  ON public.conversations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" 
  ON public.conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" 
  ON public.conversations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" 
  ON public.conversations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Drop existing overly permissive RLS policies for messages
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can create messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.messages;

-- Create helper function to check conversation ownership
CREATE OR REPLACE FUNCTION public.user_owns_conversation(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conv_id AND user_id = auth.uid()
  )
$$;

-- Create user-scoped RLS policies for messages based on conversation ownership
CREATE POLICY "Users can view messages in own conversations" 
  ON public.messages 
  FOR SELECT 
  USING (public.user_owns_conversation(conversation_id));

CREATE POLICY "Users can create messages in own conversations" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (public.user_owns_conversation(conversation_id));

CREATE POLICY "Users can update messages in own conversations" 
  ON public.messages 
  FOR UPDATE 
  USING (public.user_owns_conversation(conversation_id));

CREATE POLICY "Users can delete messages in own conversations" 
  ON public.messages 
  FOR DELETE 
  USING (public.user_owns_conversation(conversation_id));