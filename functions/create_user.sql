-- Create a function to insert a user record that bypasses RLS
CREATE OR REPLACE FUNCTION public.create_user(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone_number)
  VALUES (user_id, user_email, user_name, user_role, user_phone);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user TO anon;

