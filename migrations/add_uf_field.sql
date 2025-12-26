-- Adicionar o campo UF à tabela de eventos
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS uf TEXT;

-- Comentário para documentar a coluna
COMMENT ON COLUMN public.events.uf IS 'Unidade Federativa (Estado) onde o evento será realizado';

