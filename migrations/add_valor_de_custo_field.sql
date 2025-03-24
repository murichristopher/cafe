-- Adicionar coluna valor_de_custo à tabela events se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'valor_de_custo'
  ) THEN
    ALTER TABLE public.events ADD COLUMN valor_de_custo DECIMAL(10, 2);
    
    -- Adicionar comentário para documentar a coluna
    COMMENT ON COLUMN public.events.valor_de_custo IS 'Valor de custo do evento em R$';
  END IF;
END $$; 