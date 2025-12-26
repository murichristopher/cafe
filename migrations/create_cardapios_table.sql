-- Criar tabela de cardápios
CREATE TABLE IF NOT EXISTS cardapios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  quantidade_participantes INTEGER NOT NULL,
  salgados JSONB DEFAULT '[]'::jsonb,
  doces JSONB DEFAULT '[]'::jsonb,
  bebidas JSONB DEFAULT '{}'::jsonb,
  informacoes_adicionais TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_cardapios_data ON cardapios(data);
CREATE INDEX IF NOT EXISTS idx_cardapios_created_at ON cardapios(created_at);

-- Comentários
COMMENT ON TABLE cardapios IS 'Armazena cardápios recebidos via webhook';
COMMENT ON COLUMN cardapios.salgados IS 'Array JSON com lista de salgados';
COMMENT ON COLUMN cardapios.doces IS 'Array JSON com lista de doces';
COMMENT ON COLUMN cardapios.bebidas IS 'Objeto JSON com bebidas e quantidades';

