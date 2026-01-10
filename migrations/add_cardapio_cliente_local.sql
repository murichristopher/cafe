-- Adicionar campos de cliente e local à tabela cardapios
ALTER TABLE cardapios 
ADD COLUMN IF NOT EXISTS nome_cliente TEXT,
ADD COLUMN IF NOT EXISTS local TEXT;

-- Comentários
COMMENT ON COLUMN cardapios.nome_cliente IS 'Nome do cliente que solicitou o cardápio';
COMMENT ON COLUMN cardapios.local IS 'Local onde será realizado o evento';

