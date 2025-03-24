-- Habilitar extensão de UUID se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar se o bucket 'imagens' existe, se não, criar
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens', 'imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar se o bucket 'event-images' existe, se não, criar
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes para garantir que não haja conflitos
BEGIN;
  -- Política para imagens
  DROP POLICY IF EXISTS "Imagens abertas para leitura" ON storage.objects;
  DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
  DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seus próprios arquivos" ON storage.objects;
  DROP POLICY IF EXISTS "Usuários autenticados podem excluir seus próprios arquivos" ON storage.objects;
  
  -- Políticas para permitir operações em todos os buckets
  CREATE POLICY "Imagens abertas para leitura" 
    ON storage.objects FOR SELECT 
    USING (bucket_id IN ('imagens', 'event-images'));

  CREATE POLICY "Usuários autenticados podem fazer upload" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id IN ('imagens', 'event-images') AND auth.role() = 'authenticated');

  CREATE POLICY "Usuários autenticados podem atualizar seus próprios arquivos" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id IN ('imagens', 'event-images') AND auth.role() = 'authenticated');

  CREATE POLICY "Usuários autenticados podem excluir seus próprios arquivos" 
    ON storage.objects FOR DELETE 
    USING (bucket_id IN ('imagens', 'event-images') AND auth.role() = 'authenticated');
COMMIT; 