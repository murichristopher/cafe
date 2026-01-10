-- Adicionar novos campos à tabela cardapios
ALTER TABLE cardapios 
ADD COLUMN IF NOT EXISTS sanduiches JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS titulo TEXT DEFAULT 'COQUETEL',
ADD COLUMN IF NOT EXISTS investimento DECIMAL(10, 2);

-- Comentários
COMMENT ON COLUMN cardapios.sanduiches IS 'Array JSON com lista de sanduíches';
COMMENT ON COLUMN cardapios.titulo IS 'Título do cardápio (ex: COQUETEL, Coffee Break)';
COMMENT ON COLUMN cardapios.investimento IS 'Valor do investimento do cardápio';

