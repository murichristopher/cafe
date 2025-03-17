-- Verificar a estrutura atual da tabela events
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'events'
ORDER BY 
    ordinal_position;

