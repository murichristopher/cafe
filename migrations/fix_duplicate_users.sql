-- This script identifies and fixes duplicate users in the database

-- First, let's identify any duplicate emails
SELECT email, COUNT(*) 
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Find users that exist in auth but not in the users table
-- Note: This requires admin access to auth.users which might not be available
-- through the SQL editor in Supabase

-- Create a function to safely merge user records
CREATE OR REPLACE FUNCTION merge_duplicate_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_record RECORD;
  primary_id UUID;
BEGIN
  -- For each email with duplicates
  FOR duplicate_record IN 
    SELECT email 
    FROM public.users 
    GROUP BY email 
    HAVING COUNT(*) > 1
  LOOP
    -- Get the first ID as the primary
    SELECT id INTO primary_id 
    FROM public.users 
    WHERE email = duplicate_record.email 
    LIMIT 1;
    
    -- Delete the other records
    DELETE FROM public.users 
    WHERE email = duplicate_record.email 
    AND id != primary_id;
    
    RAISE NOTICE 'Merged duplicate users for email: %', duplicate_record.email;
  END LOOP;
END;
$$;

-- Execute the function to fix duplicates
SELECT merge_duplicate_users();

