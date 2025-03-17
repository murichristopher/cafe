-- Ensure the phone_number column exists in the users table
DO $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'phone_number'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE public.users ADD COLUMN phone_number TEXT;
    
    -- Add a comment to document the column
    COMMENT ON COLUMN public.users.phone_number IS 'Número de telefone do usuário no formato brasileiro';
    
    RAISE NOTICE 'Added phone_number column to users table';
  ELSE
    RAISE NOTICE 'phone_number column already exists in users table';
  END IF;
END $$;

