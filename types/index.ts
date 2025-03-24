export type User = {
  id: string
  email: string
  name: string
  role: "admin" | "fornecedor"
  phone_number?: string // Campo de telefone opcional
}

export type Event = {
  id: string
  title: string
  description: string
  date: string
  data_termino?: string | null
  location: string
  admin_id: string
  fornecedor_id: string | null
  status: "pendente" | "confirmado" | "cancelado" | "aguardando_aprovacao" | "concluido"
  created_at: string
  valor?: number | null
  valor_de_custo?: number | null
  nota_fiscal?: string | null
  pagamento?: "pendente" | "realizado" | "cancelado" | null
  horario_fim?: string | null
  dia_pagamento?: string | null
  imagem_chegada?: string | null
  imagem_inicio?: string | null
  imagem_final?: string | null
  pax?: number | null
  event_image?: string | null // Nova propriedade para a imagem do evento
}

export type EventWithFornecedor = Event & {
  fornecedor: User | null
}

export type EventFornecedor = {
  id: string
  event_id: string
  fornecedor_id: string // Corrigido: user_id -> fornecedor_id
  created_at: string
}

export type EventWithFornecedores = Event & {
  fornecedores: User[]
}

export type EventWithAdmin = Event & {
  admin: User
}

// Adicionar interface Database para o Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, "id"> & { id?: string }
        Update: Partial<User>
      }
      events: {
        Row: Event
        Insert: Omit<Event, "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Event>
      }
      event_fornecedores: {
        Row: EventFornecedor
        Insert: Omit<EventFornecedor, "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<EventFornecedor>
      }
    }
    Functions: {
      get_user_by_id: {
        Args: { user_id: string }
        Returns: User
      }
    }
  }
}

