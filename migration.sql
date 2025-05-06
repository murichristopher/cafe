-- Schema para a tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  type TEXT NOT NULL, -- 'event_assignment', 'reminder', 'update', 'system', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Política RLS para garantir que usuários vejam apenas suas próprias notificações
CREATE POLICY "Usuários podem ver apenas suas próprias notificações"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir que usuários marquem suas notificações como lidas
CREATE POLICY "Usuários podem atualizar apenas suas próprias notificações"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que o sistema crie notificações
CREATE POLICY "Sistema pode criar notificações"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Habilitar RLS na tabela
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Adicionar campo push_subscription à tabela users (se ainda não existir)
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Criar índice para pesquisas por push_subscription
CREATE INDEX IF NOT EXISTS idx_users_push_subscription ON users ((push_subscription IS NOT NULL)); 