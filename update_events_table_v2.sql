-- Atualizar a tabela de eventos com as novas colunas
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS horario_fim TIME,
ADD COLUMN IF NOT EXISTS dia_pagamento DATE;

-- Verificar se as colunas existentes já estão presentes
DO $$
BEGIN
    -- Adicionar coluna valor se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'events' 
                  AND column_name = 'valor') THEN
        ALTER TABLE public.events ADD COLUMN valor DECIMAL(10, 2);
    END IF;
    
    -- Adicionar coluna nota_fiscal se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'events' 
                  AND column_name = 'nota_fiscal') THEN
        ALTER TABLE public.events ADD COLUMN nota_fiscal TEXT;
    END IF;
    
    -- Adicionar coluna pagamento se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'events' 
                  AND column_name = 'pagamento') THEN
        ALTER TABLE public.events ADD COLUMN pagamento TEXT CHECK (pagamento IN ('pendente', 'realizado', 'cancelado'));
    END IF;
END $$;

-- Comentários para documentar as colunas
COMMENT ON COLUMN public.events.title IS 'Nome do evento';
COMMENT ON COLUMN public.events.description IS 'Detalhes do evento';
COMMENT ON COLUMN public.events.date IS 'Data do evento';
COMMENT ON COLUMN public.events.horario_fim IS 'Horário de fim do evento';
COMMENT ON COLUMN public.events.location IS 'Endereço do evento';
COMMENT ON COLUMN public.events.fornecedor_id IS 'ID do fornecedor';
COMMENT ON COLUMN public.events.nota_fiscal IS 'Número da nota fiscal';
COMMENT ON COLUMN public.events.valor IS 'Valor do evento em R$';
COMMENT ON COLUMN public.events.status IS 'Status do evento (pending, confirmed, cancelled)';
COMMENT ON COLUMN public.events.dia_pagamento IS 'Data programada para o pagamento';
COMMENT ON COLUMN public.events.pagamento IS 'Status do pagamento (pendente, realizado, cancelado)';

