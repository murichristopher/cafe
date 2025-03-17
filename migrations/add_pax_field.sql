-- Add the pax field to the events table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'pax'
  ) THEN
    ALTER TABLE public.events ADD COLUMN pax INTEGER;
    
    -- Add a comment to document the column
    COMMENT ON COLUMN public.events.pax IS 'Número de pessoas no evento';
  END IF;
END $$;

