-- Adiciona o campo assigned_to à tabela kanban_tasks
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS assigned_to TEXT;
