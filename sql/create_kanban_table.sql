-- Create a simple kanban table where all admins share the same board
-- Boards are global; tasks belong to columns and have an ordering.

CREATE TABLE IF NOT EXISTS kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  column_name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  assigned_to TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index to speed up queries by column and position
CREATE INDEX IF NOT EXISTS idx_kanban_column_position ON kanban_tasks(column_name, position);

-- Insert default columns (not strictly necessary but helpful)
-- We'll store tasks only; columns are logical: 'todo','doing','done'

-- Grant permissions to admins role (assuming you have an 'admin' role in RLS)
-- If using Row-Level Security, adjust policies accordingly.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kanban_tasks TO authenticated;

-- Optional: a view that returns tasks ordered per column
CREATE VIEW kanban_tasks_ordered AS
SELECT * FROM kanban_tasks ORDER BY column_name, position;
