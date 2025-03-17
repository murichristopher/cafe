"use client"

import * as React from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type Option = {
  label: string
  value: string
}

interface MultiSelectDialogProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
  placeholder?: string
}

export function MultiSelectDialog({
  options,
  selected,
  onChange,
  className,
  placeholder = "Selecione opções...",
}: MultiSelectDialogProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  // Find the label for a value
  const getOptionLabel = (value: string) => {
    return options.find((option) => option.value === value)?.label || value
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          type="button"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background border-input hover:bg-accent hover:text-accent-foreground h-auto min-h-10",
            className,
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((value) => (
                <Badge key={value} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-white">
                  {getOptionLabel(value)}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(value)
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Buscar fornecedor..." className="h-9" />
          <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        onChange(selected.filter((item) => item !== option.value))
                      } else {
                        onChange([...selected, option.value])
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50",
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          <div className="flex items-center justify-end border-t p-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="mr-2">
              Cancelar
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Confirmar
            </Button>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

