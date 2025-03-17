-- Criar uma nova tabela para o relacionamento muitos-para-muitos entre eventos e fornecedores
CREATE TABLE IF NOT EXISTS event_fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, fornecedor_id)
);

-- Adicionar políticas RLS para a nova tabela
ALTER TABLE event_fornecedores ENABLE ROW LEVEL SECURITY;

-- Política para permitir que administradores vejam todos os registros
CREATE POLICY "Admins podem ver todos os registros de event_fornecedores"
  ON event_fornecedores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Política para permitir que fornecedores vejam apenas seus próprios registros
CREATE POLICY "Fornecedores podem ver seus próprios registros de event_fornecedores"
  ON event_fornecedores
  FOR SELECT
  TO authenticated
  USING (
    fornecedor_id = auth.uid()
  );

-- Política para permitir que administradores insiram registros
CREATE POLICY "Admins podem inserir registros em event_fornecedores"
  ON event_fornecedores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Política para permitir que administradores atualizem registros
CREATE POLICY "Admins podem atualizar registros em event_fornecedores"
  ON event_fornecedores
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Política para permitir que administradores excluam registros
CREATE POLICY "Admins podem excluir registros em event_fornecedores"
  ON event_fornecedores
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Função para migrar dados existentes
CREATE OR REPLACE FUNCTION migrate_event_fornecedores() RETURNS void AS $$
BEGIN
  -- Inserir registros na nova tabela baseados nos fornecedor_id existentes
  INSERT INTO event_fornecedores (event_id, fornecedor_id)
  SELECT id, fornecedor_id FROM events
  WHERE fornecedor_id IS NOT NULL
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Executar a migração
SELECT migrate_event_fornecedores();

