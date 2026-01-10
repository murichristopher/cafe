import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ItemsSectionProps {
  title: string
  items: string[]
  options: string[]
  customValue: string
  onToggle: (item: string) => void
  onAddCustom: () => void
  onCustomChange: (value: string) => void
  isLoading: boolean
  required?: boolean
}

export function ItemsSection({
  title,
  items,
  options,
  customValue,
  onToggle,
  onAddCustom,
  onCustomChange,
  isLoading,
  required = false,
}: ItemsSectionProps) {
  return (
    <div className="space-y-3">
      <Label className="text-lg font-semibold text-white">
        {title} {required && "*"}
      </Label>
      <div className="border border-zinc-700 rounded-md p-4 bg-zinc-900">
        <div className="grid grid-cols-2 gap-4">
          {options.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`${title.toLowerCase()}-${option}`}
                checked={items.includes(option)}
                onChange={() => onToggle(option)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-zinc-600 text-yellow-400 focus:ring-yellow-400 bg-zinc-800"
              />
              <label
                htmlFor={`${title.toLowerCase()}-${option}`}
                className="text-sm text-white cursor-pointer flex-1"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${title.toLowerCase()}-custom`} className="text-sm">
          Adicionar {title.toLowerCase()} customizado
        </Label>
        <div className="flex gap-2">
          <Input
            id={`${title.toLowerCase()}-custom`}
            placeholder={`Nome do ${title.toLowerCase()}`}
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onAddCustom()
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAddCustom}
            disabled={isLoading || !customValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

