-- Adiciona campo cargo na tabela de registros públicos de eventos
ALTER TABLE event_registros ADD COLUMN IF NOT EXISTS cargo TEXT;
