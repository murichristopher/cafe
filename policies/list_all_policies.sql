-- Listar todas as políticas existentes para a tabela events
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies 
WHERE 
  tablename = 'events';

-- Listar todas as políticas existentes para a tabela storage.objects
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies 
WHERE 
  schemaname = 'storage' AND tablename = 'objects';

