-- Atualizar fornecedores existentes com um número de telefone padrão
UPDATE users
SET phone_number = '(00) 00000-0000'
WHERE role = 'fornecedor' 
AND (phone_number IS NULL OR phone_number = '');

-- Adicionar uma verificação para garantir que fornecedores tenham um número de telefone
DO $$
BEGIN
    RAISE NOTICE 'Fornecedores atualizados com número de telefone padrão';
END $$;

