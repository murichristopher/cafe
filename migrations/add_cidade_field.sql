-- Adicionar o campo cidade à tabela de eventos
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS cidade TEXT;

-- Comentário para documentar a coluna
COMMENT ON COLUMN public.events.cidade IS 'Cidade onde o evento será realizado';

