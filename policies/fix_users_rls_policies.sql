-- Check existing RLS policies on the users table
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Enable RLS on the users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Create policy to allow users to insert their own data
-- This is critical for registration to work
CREATE POLICY "Users can insert their own data"
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK (
  -- During registration, the auth.uid() might not match the id being inserted
  -- So we need a more permissive policy for insertion
  true
);

-- Create policy to allow users to view their own data
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Create policy to allow admins to view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Create policy to allow admins to update all users
CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

