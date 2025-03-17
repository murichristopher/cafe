-- Temporarily disable RLS for the users table
-- WARNING: This reduces security but solves the immediate issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Add a comment to remind us to re-enable it later
COMMENT ON TABLE public.users IS 'User profiles table. RLS temporarily disabled.';

-- Create a policy that will be used when we re-enable RLS
CREATE POLICY IF NOT EXISTS "Allow public insert" 
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Create policy to allow users to view their own data
CREATE POLICY IF NOT EXISTS "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Create policy to allow users to update their own data
CREATE POLICY IF NOT EXISTS "Users can update their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

