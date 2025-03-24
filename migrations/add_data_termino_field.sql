-- Adicionar coluna data_termino à tabela events se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'data_termino'
  ) THEN
    ALTER TABLE public.events ADD COLUMN data_termino TIMESTAMPTZ;
    
    -- Adicionar comentário para documentar a coluna
    COMMENT ON COLUMN public.events.data_termino IS 'Data de término do evento';
  END IF;
END $$; 