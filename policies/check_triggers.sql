-- Verificar triggers na tabela events
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM 
  information_schema.triggers
WHERE 
  event_object_table = 'events';

