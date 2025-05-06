-- Script para verificar e criar tabelas de notificações no Supabase
-- Execute no SQL Editor do Supabase

-- 1. Verificar se a tabela notifications existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    -- Criar tabela notifications
    CREATE TABLE public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      read BOOLEAN DEFAULT false,
      event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Comentários
    COMMENT ON TABLE public.notifications IS 'Armazena notificações do sistema para os usuários';
    COMMENT ON COLUMN public.notifications.id IS 'ID único da notificação';
    COMMENT ON COLUMN public.notifications.user_id IS 'ID do usuário que receberá a notificação';
    COMMENT ON COLUMN public.notifications.title IS 'Título da notificação';
    COMMENT ON COLUMN public.notifications.message IS 'Conteúdo da notificação';
    COMMENT ON COLUMN public.notifications.type IS 'Tipo da notificação (system, event_update, etc)';
    COMMENT ON COLUMN public.notifications.read IS 'Indica se a notificação foi lida';
    COMMENT ON COLUMN public.notifications.event_id IS 'ID do evento relacionado (se houver)';
    
    RAISE NOTICE 'Tabela notifications criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela notifications já existe.';
  END IF;
END $$;

-- 2. Verificar se a tabela push_subscriptions existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'push_subscriptions'
  ) THEN
    -- Criar tabela push_subscriptions
    CREATE TABLE public.push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      subscription TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Comentários
    COMMENT ON TABLE public.push_subscriptions IS 'Armazena inscrições para notificações push';
    COMMENT ON COLUMN public.push_subscriptions.id IS 'ID único da inscrição';
    COMMENT ON COLUMN public.push_subscriptions.user_id IS 'ID do usuário dono da inscrição';
    COMMENT ON COLUMN public.push_subscriptions.subscription IS 'Dados da inscrição push em formato JSON como string';
    
    RAISE NOTICE 'Tabela push_subscriptions criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela push_subscriptions já existe.';
  END IF;
END $$;

-- 3. Verificar permissões e configurar RLS para tabela notifications
DO $$ 
BEGIN
  -- Habilitar RLS na tabela notifications
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  
  -- Limpar políticas existentes
  DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.notifications;
  DROP POLICY IF EXISTS "Usuários podem inserir suas próprias notificações" ON public.notifications;
  DROP POLICY IF EXISTS "Serviço pode gerenciar todas as notificações" ON public.notifications;
  
  -- Criar política principal para serviço poder gerenciar todas as notificações
  CREATE POLICY "Serviço pode gerenciar todas as notificações" 
  ON public.notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);
  
  -- Criar política para usuários verem suas próprias notificações 
  CREATE POLICY "Usuários podem ver suas próprias notificações" 
  ON public.notifications
  FOR SELECT 
  USING (auth.uid()::text = user_id);
  
  -- Criar política para usuários inserirem suas próprias notificações
  CREATE POLICY "Usuários podem inserir suas próprias notificações" 
  ON public.notifications
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id);
  
  RAISE NOTICE 'Políticas RLS para tabela notifications configuradas com sucesso!';
END $$;

-- 4. Verificar permissões e configurar RLS para tabela push_subscriptions
DO $$ 
BEGIN
  -- Habilitar RLS na tabela push_subscriptions
  ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
  
  -- Limpar políticas existentes
  DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias inscrições" ON public.push_subscriptions;
  DROP POLICY IF EXISTS "Serviço pode gerenciar todas as inscrições" ON public.push_subscriptions;
  
  -- Criar política principal para serviço poder gerenciar todas as inscrições
  CREATE POLICY "Serviço pode gerenciar todas as inscrições" 
  ON public.push_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);
  
  -- Criar política para usuários gerenciarem suas próprias inscrições
  CREATE POLICY "Usuários podem gerenciar suas próprias inscrições" 
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
  
  RAISE NOTICE 'Políticas RLS para tabela push_subscriptions configuradas com sucesso!';
END $$;

-- 5. Contar registros nas tabelas para verificar se está tudo funcionando
SELECT 'Notificações: ' || COUNT(*) AS contagem FROM public.notifications;
SELECT 'Inscrições push: ' || COUNT(*) AS contagem FROM public.push_subscriptions; 