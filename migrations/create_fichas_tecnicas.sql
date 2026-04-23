-- Adiciona custo unitário aos produtos de estoque
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC(10, 4) DEFAULT 0;

-- Tabela de fichas técnicas (produtos produzidos)
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  rendimento NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unidade_rendimento TEXT NOT NULL DEFAULT 'unidade',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredientes de cada ficha técnica
CREATE TABLE IF NOT EXISTS ficha_ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID NOT NULL REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade NUMERIC(10, 4) NOT NULL,
  unidade_medida TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at em fichas_tecnicas
CREATE OR REPLACE FUNCTION update_fichas_tecnicas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_fichas_tecnicas_updated_at ON fichas_tecnicas;
CREATE TRIGGER set_fichas_tecnicas_updated_at
  BEFORE UPDATE ON fichas_tecnicas
  FOR EACH ROW EXECUTE FUNCTION update_fichas_tecnicas_updated_at();
