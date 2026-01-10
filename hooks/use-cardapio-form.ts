import { useState } from "react"

export interface CardapioFormState {
  data: string
  horarioInicio: string
  horarioFim: string
  quantidadeParticipantes: string
  nomeCliente: string
  local: string
  titulo: string
  investimento: string
  sanduiches: string[]
  sanduicheCustom: string
  salgados: string[]
  salgadoCustom: string
  doces: string[]
  doceCustom: string
  bebidas: Array<{ nome: string; quantidade: string }>
  bebidaCustom: string
  bebidaQuantidade: string
  informacoesAdicionais: string
}

export const useCardapioForm = () => {
  const [formState, setFormState] = useState<CardapioFormState>({
    data: "",
    horarioInicio: "",
    horarioFim: "",
    quantidadeParticipantes: "",
    nomeCliente: "",
    local: "",
    titulo: "",
    investimento: "",
    sanduiches: [],
    sanduicheCustom: "",
    salgados: [],
    salgadoCustom: "",
    doces: [],
    doceCustom: "",
    bebidas: [],
    bebidaCustom: "",
    bebidaQuantidade: "",
    informacoesAdicionais: "",
  })

  const updateField = <K extends keyof CardapioFormState>(field: K, value: CardapioFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSalgadoToggle = (salgado: string) => {
    setFormState((prev) => ({
      ...prev,
      salgados: prev.salgados.includes(salgado)
        ? prev.salgados.filter((s) => s !== salgado)
        : [...prev.salgados, salgado],
    }))
  }

  const handleAddSalgadoCustom = () => {
    setFormState((prev) => {
      if (prev.salgadoCustom.trim() && !prev.salgados.includes(prev.salgadoCustom.trim())) {
        return {
          ...prev,
          salgados: [...prev.salgados, prev.salgadoCustom.trim()],
          salgadoCustom: "",
        }
      }
      return prev
    })
  }

  const handleDoceToggle = (doce: string) => {
    setFormState((prev) => ({
      ...prev,
      doces: prev.doces.includes(doce) ? prev.doces.filter((d) => d !== doce) : [...prev.doces, doce],
    }))
  }

  const handleAddDoceCustom = () => {
    setFormState((prev) => {
      if (prev.doceCustom.trim() && !prev.doces.includes(prev.doceCustom.trim())) {
        return {
          ...prev,
          doces: [...prev.doces, prev.doceCustom.trim()],
          doceCustom: "",
        }
      }
      return prev
    })
  }

  const handleBebidaToggle = (bebida: string) => {
    setFormState((prev) => {
      const existingIndex = prev.bebidas.findIndex((b) => b.nome === bebida)
      if (existingIndex >= 0) {
        return {
          ...prev,
          bebidas: prev.bebidas.filter((_, i) => i !== existingIndex),
        }
      } else {
        return {
          ...prev,
          bebidas: [...prev.bebidas, { nome: bebida, quantidade: "1" }],
        }
      }
    })
  }

  const handleBebidaQuantidadeChange = (nome: string, quantidade: string) => {
    setFormState((prev) => ({
      ...prev,
      bebidas: prev.bebidas.map((b) => (b.nome === nome ? { ...b, quantidade } : b)),
    }))
  }

  const handleAddBebidaCustom = () => {
    setFormState((prev) => {
      if (prev.bebidaCustom.trim() && !prev.bebidas.some((b) => b.nome === prev.bebidaCustom.trim())) {
        return {
          ...prev,
          bebidas: [...prev.bebidas, { nome: prev.bebidaCustom.trim(), quantidade: prev.bebidaQuantidade || "1" }],
          bebidaCustom: "",
          bebidaQuantidade: "",
        }
      }
      return prev
    })
  }

  const handleSanduicheToggle = (sanduiche: string) => {
    setFormState((prev) => ({
      ...prev,
      sanduiches: prev.sanduiches.includes(sanduiche)
        ? prev.sanduiches.filter((s) => s !== sanduiche)
        : [...prev.sanduiches, sanduiche],
    }))
  }

  const handleAddSanduicheCustom = () => {
    setFormState((prev) => {
      if (prev.sanduicheCustom.trim() && !prev.sanduiches.includes(prev.sanduicheCustom.trim())) {
        return {
          ...prev,
          sanduiches: [...prev.sanduiches, prev.sanduicheCustom.trim()],
          sanduicheCustom: "",
        }
      }
      return prev
    })
  }

  return {
    formState,
    updateField,
    handleSanduicheToggle,
    handleAddSanduicheCustom,
    handleSalgadoToggle,
    handleAddSalgadoCustom,
    handleDoceToggle,
    handleAddDoceCustom,
    handleBebidaToggle,
    handleBebidaQuantidadeChange,
    handleAddBebidaCustom,
  }
}

