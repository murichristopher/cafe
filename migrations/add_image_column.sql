-- Adicionar uma nova coluna para a imagem do evento
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_image TEXT;

-- Adicionar um comentário para documentar a coluna
COMMENT ON COLUMN public.events.event_image IS 'URL da imagem principal do evento';

