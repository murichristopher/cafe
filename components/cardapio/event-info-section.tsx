import { Calendar, Clock, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CardapioFormState } from "@/hooks/use-cardapio-form"

interface EventInfoSectionProps {
  formState: CardapioFormState
  updateField: <K extends keyof CardapioFormState>(field: K, value: CardapioFormState[K]) => void
  isLoading: boolean
}

export function EventInfoSection({ formState, updateField, isLoading }: EventInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Informações do Evento</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data" className="text-sm font-medium">
            Data *
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="data"
              type="date"
              className="pl-10 w-full"
              value={formState.data}
              onChange={(e) => updateField("data", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantidadeParticipantes" className="text-sm font-medium">
            Participantes *
          </Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="quantidadeParticipantes"
              type="number"
              min="1"
              className="pl-10 w-full"
              value={formState.quantidadeParticipantes}
              onChange={(e) => updateField("quantidadeParticipantes", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="horarioInicio" className="text-sm font-medium">
            Horário Início *
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="horarioInicio"
              type="time"
              className="pl-10 w-full"
              value={formState.horarioInicio}
              onChange={(e) => updateField("horarioInicio", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioFim" className="text-sm font-medium">
            Horário Fim *
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="horarioFim"
              type="time"
              className="pl-10 w-full"
              value={formState.horarioFim}
              onChange={(e) => updateField("horarioFim", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nomeCliente" className="text-sm font-medium">
            Nome do Cliente
          </Label>
          <Input
            id="nomeCliente"
            placeholder="Nome do cliente"
            value={formState.nomeCliente}
            onChange={(e) => updateField("nomeCliente", e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="local" className="text-sm font-medium">
            Local
          </Label>
          <Input
            id="local"
            placeholder="Local do evento"
            value={formState.local}
            onChange={(e) => updateField("local", e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="titulo" className="text-sm font-medium">
            Título
          </Label>
          <Input
            id="titulo"
            placeholder="COQUETEL"
            value={formState.titulo}
            onChange={(e) => updateField("titulo", e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="investimento" className="text-sm font-medium">
            Investimento
          </Label>
          <Input
            id="investimento"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formState.investimento}
            onChange={(e) => updateField("investimento", e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}

