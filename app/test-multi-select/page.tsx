"use client"

import { useState } from "react"
import { MultiSelectDialog, type Option } from "@/components/ui/multi-select-dialog"

export default function TestMultiSelect() {
  const options: Option[] = [
    { label: "Fornecedor 1", value: "1" },
    { label: "Fornecedor 2", value: "2" },
    { label: "Fornecedor 3", value: "3" },
    { label: "Fornecedor 4", value: "4" },
    { label: "Fornecedor 5", value: "5" },
  ]

  const [selected, setSelected] = useState<string[]>([])

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teste do MultiSelect com Dialog</h1>
      <div className="space-y-4">
        <MultiSelectDialog
          options={options}
          selected={selected}
          onChange={setSelected}
          placeholder="Selecione fornecedores..."
        />
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Selecionados:</h2>
          <pre className="bg-gray-100 p-2 rounded mt-2">{JSON.stringify(selected, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

