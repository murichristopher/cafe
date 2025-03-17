-- Create a function to insert a user record
CREATE OR REPLACE FUNCTION public.create_user(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT,
  p_phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone_number)
  VALUES (p_id, p_email, p_name, p_role, p_phone);
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'User with ID % already exists', p_id;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in create_user function: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user TO anon;

