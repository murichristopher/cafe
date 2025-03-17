-- Primeiro, vamos verificar a restrição atual
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'events'::regclass AND conname = 'events_status_check';

-- Remover a restrição atual
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

-- Adicionar uma nova restrição que aceite os valores em português
ALTER TABLE events ADD CONSTRAINT events_status_check 
CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'aguardando_aprovacao', 'concluido'));

-- Verificar se a restrição foi atualizada corretamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'events'::regclass AND conname = 'events_status_check';

