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
  uf?: string | null
  cidade?: string | null
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

// Tipo para notificações
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  event_id?: string;
  read: boolean;
  type: 'event_assignment' | 'reminder' | 'update' | 'system';
  created_at: string;
}

// Tipo para produtos
export type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  unidade_medida: string;
  estoque_atual: number;
  estoque_minimo?: number | null;
  created_at: string;
  updated_at: string;
}

// Tipo para movimentações de estoque
export type EstoqueMovimentacao = {
  id: string;
  produto_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data_movimentacao: string;
  responsavel_id?: string | null;
  observacoes?: string | null;
  created_at: string;
}

// Tipo para movimentação com dados relacionados
export type EstoqueMovimentacaoWithRelations = EstoqueMovimentacao & {
  produto: Produto;
  responsavel?: User | null;
}

// Tipo para cardápios
export type Cardapio = {
  id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  quantidade_participantes: number;
  salgados: string[];
  doces: string[];
  bebidas: Record<string, number>;
  informacoes_adicionais?: string | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
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
        Insert: Omit<Event, "id"> & { id?: string }
        Update: Partial<Event>
      }
      event_fornecedores: {
        Row: {
          id: string
          event_id: string
          fornecedor_id: string
          created_at?: string
        }
        Insert: Omit<{
          id: string
          event_id: string
          fornecedor_id: string
          created_at?: string
        }, "id"> & { id?: string }
        Update: Partial<{
          id: string
          event_id: string
          fornecedor_id: string
          created_at?: string
        }>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, "id"> & { id?: string }
        Update: Partial<Notification>
      }
      produtos: {
        Row: Produto
        Insert: Omit<Produto, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Produto, "id" | "created_at" | "updated_at">>
      }
      estoque_movimentacoes: {
        Row: EstoqueMovimentacao
        Insert: Omit<EstoqueMovimentacao, "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Omit<EstoqueMovimentacao, "id" | "created_at">>
      }
      cardapios: {
        Row: Cardapio
        Insert: Omit<Cardapio, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Cardapio, "id" | "created_at" | "updated_at">>
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

