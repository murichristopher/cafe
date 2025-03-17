-- Atualizar todos os eventos com status 'pending' para 'pendente'
UPDATE events 
SET status = 'pendente' 
WHERE status = 'pending';

-- Atualizar todos os eventos com status 'confirmed' para 'confirmado'
UPDATE events 
SET status = 'confirmado' 
WHERE status = 'confirmed';

-- Atualizar todos os eventos com status 'cancelled' para 'cancelado'
UPDATE events 
SET status = 'cancelado' 
WHERE status = 'cancelled';

-- Verificar os valores atualizados
SELECT DISTINCT status FROM events;

