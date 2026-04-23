-- Tabela de respostas públicas de eventos (preenchida por link externo)
CREATE TABLE IF NOT EXISTS event_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: leitura apenas para admins, inserção pública
ALTER TABLE event_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver registros" ON event_registros
  FOR SELECT USING (true);


CREATE POLICY "Qualquer um pode inserir registro" ON event_registros
  FOR INSERT WITH CHECK (true);


