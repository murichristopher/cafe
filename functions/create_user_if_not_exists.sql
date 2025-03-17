-- Create a function to insert a user record only if they don't already exist
CREATE OR REPLACE FUNCTION public.create_user_if_not_exists(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT,
  p_phone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
BEGIN
  -- Check if the user already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_id OR email = p_email) THEN
    RAISE NOTICE 'User with ID % or email % already exists', p_id, p_email;
    RETURN FALSE;
  END IF;

  -- Insert the new user
  INSERT INTO public.users (id, email, name, role, phone_number)
  VALUES (p_id, p_email, p_name, p_role, p_phone);
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'User with ID % or email % already exists (caught exception)', p_id, p_email;
    RETURN FALSE;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in create_user_if_not_exists function: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_if_not_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_if_not_exists TO anon;

