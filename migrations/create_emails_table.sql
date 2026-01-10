-- Criar tabela de emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_emails_to_email ON emails USING GIN(to_email);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_created_by ON emails(created_by);

-- Comentários
COMMENT ON TABLE emails IS 'Armazena emails enviados via Resend';
COMMENT ON COLUMN emails.resend_id IS 'ID retornado pelo Resend após envio';
COMMENT ON COLUMN emails.status IS 'Status do email: sent, delivered, bounced, failed';

-- Habilitar RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver todos os emails (admins)
CREATE POLICY "Usuários autenticados podem ver emails"
  ON emails FOR SELECT
  TO authenticated
  USING (true);

-- Política RLS: usuários autenticados podem criar emails
CREATE POLICY "Usuários autenticados podem criar emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política RLS: usuários autenticados podem atualizar emails
CREATE POLICY "Usuários autenticados podem atualizar emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

