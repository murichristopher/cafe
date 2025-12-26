-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  unidade_medida TEXT NOT NULL DEFAULT 'uni', -- uni, kg, litro, etc
  estoque_atual NUMERIC(10, 2) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade NUMERIC(10, 2) NOT NULL,
  data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responsavel_id UUID REFERENCES users(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacoes_produto_id ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacoes_data ON estoque_movimentacoes(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacoes_tipo ON estoque_movimentacoes(tipo);

-- Função para atualizar estoque_atual automaticamente
CREATE OR REPLACE FUNCTION atualizar_estoque()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE produtos 
    SET estoque_atual = estoque_atual + NEW.quantidade,
        updated_at = NOW()
    WHERE id = NEW.produto_id;
  ELSIF NEW.tipo = 'saida' THEN
    UPDATE produtos 
    SET estoque_atual = estoque_atual - NEW.quantidade,
        updated_at = NOW()
    WHERE id = NEW.produto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estoque automaticamente
CREATE TRIGGER trigger_atualizar_estoque
AFTER INSERT ON estoque_movimentacoes
FOR EACH ROW
EXECUTE FUNCTION atualizar_estoque();

-- Desabilitar RLS nas tabelas (sem políticas RLS)
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentacoes DISABLE ROW LEVEL SECURITY;

