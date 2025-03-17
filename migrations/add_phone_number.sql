-- Adicionar coluna phone_number à tabela users
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'phone_number'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE users ADD COLUMN phone_number TEXT;
        
        -- Comentário na coluna
        COMMENT ON COLUMN users.phone_number IS 'Número de telefone do usuário no formato brasileiro';
        
        RAISE NOTICE 'Coluna phone_number adicionada com sucesso à tabela users';
    ELSE
        RAISE NOTICE 'Coluna phone_number já existe na tabela users';
    END IF;
END $$;

