-- Remover todas as políticas RLS das tabelas de estoque (caso já tenham sido criadas)

-- Remover políticas de produtos
DROP POLICY IF EXISTS "Admins podem ver todos os produtos" ON produtos;
DROP POLICY IF EXISTS "Admins podem inserir produtos" ON produtos;
DROP POLICY IF EXISTS "Admins podem atualizar produtos" ON produtos;
DROP POLICY IF EXISTS "Admins podem excluir produtos" ON produtos;

-- Remover políticas de movimentações
DROP POLICY IF EXISTS "Admins podem ver todas as movimentações" ON estoque_movimentacoes;
DROP POLICY IF EXISTS "Admins podem inserir movimentações" ON estoque_movimentacoes;
DROP POLICY IF EXISTS "Admins podem atualizar movimentações" ON estoque_movimentacoes;
DROP POLICY IF EXISTS "Admins podem excluir movimentações" ON estoque_movimentacoes;

-- Desabilitar RLS nas tabelas
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentacoes DISABLE ROW LEVEL SECURITY;

