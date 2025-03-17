-- Adicionar novos campos à tabela de eventos
ALTER TABLE public.events 
ADD COLUMN valor DECIMAL(10, 2),
ADD COLUMN nota_fiscal TEXT,
ADD COLUMN pagamento TEXT CHECK (pagamento IN ('pendente', 'realizado', 'cancelado'));

