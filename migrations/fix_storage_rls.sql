-- Modificar as configurações RLS para armazenamento

-- 1. Verificar e atualizar os buckets existentes
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('imagens', 'event-images');

-- 2. Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Imagens abertas para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seus próprios arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir seus próprios arquivos" ON storage.objects;

-- 3. Criar uma política totalmente permissiva temporariamente
-- Isso permitirá qualquer acesso aos buckets especificados
CREATE POLICY "Acesso total temporário a imagens" 
  ON storage.objects 
  USING (bucket_id IN ('imagens', 'event-images'));

-- 4. Alternativamente, se a abordagem acima não funcionar, desabilitar RLS temporariamente
-- Isso é uma medida extrema e deve ser usada apenas para desenvolvimento
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 5. Verificar se os buckets existem e têm as configurações corretas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'imagens') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('imagens', 'imagens', true, 50000000, '{image/*}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'event-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('event-images', 'event-images', true, 50000000, '{image/*}');
  END IF;
END $$; 