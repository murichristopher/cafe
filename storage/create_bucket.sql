-- Criar o bucket 'imagens' para armazenar as imagens dos eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens', 'imagens', true);

-- Criar políticas de acesso para o bucket 'imagens'

-- Política para permitir leitura pública das imagens
CREATE POLICY "Imagens são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'imagens');

-- Política para permitir upload de imagens por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'imagens'
    AND (storage.foldername(name))[1] = 'eventos'
);

-- Política para permitir que usuários autenticados atualizem suas próprias imagens
CREATE POLICY "Usuários autenticados podem atualizar suas próprias imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'imagens')
WITH CHECK (bucket_id = 'imagens');

-- Política para permitir que usuários autenticados deletem suas próprias imagens
CREATE POLICY "Usuários autenticados podem deletar suas próprias imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'imagens');

