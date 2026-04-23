"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Undo2, Trash2, Check } from "lucide-react"

interface PhotoAnnotatorProps {
  imageUrl: string
  onSave: (dataUrl: string) => void
}

const COLORS = [
  { value: "#ef4444", label: "Vermelho" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#22c55e", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#ffffff", label: "Branco" },
  { value: "#000000", label: "Preto" },
]

const BRUSH_SIZE = 14 // espessura fixa grande, estilo WhatsApp

export function PhotoAnnotator({ imageUrl, onSave }: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Tudo de desenho via refs — zero re-render durante o traço
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const colorRef = useRef("#ef4444")
  const historyRef = useRef<ImageData[]>([])

  // Só estado de UI (cores e contador de history para habilitar/desabilitar botões)
  const [selectedColor, setSelectedColor] = useState("#ef4444")
  const [canUndo, setCanUndo] = useState(false)

  // Carrega a imagem uma vez
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)]
      setCanUndo(false)
    }
    img.src = imageUrl
  }, [imageUrl])

  // Registra os eventos uma única vez — sem dependências que mudam
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      if ("touches" in e) {
        const t = e.touches[0]
        return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
    }

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      // Salva snapshot antes de começar traço
      historyRef.current = [
        ...historyRef.current,
        ctx.getImageData(0, 0, canvas.width, canvas.height),
      ]
      setCanUndo(historyRef.current.length > 1)
      isDrawing.current = true
      lastPos.current = getPos(e)
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      if (!isDrawing.current) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const pos = getPos(e)
      if (lastPos.current) {
        ctx.beginPath()
        ctx.strokeStyle = colorRef.current
        ctx.lineWidth = BRUSH_SIZE
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      }
      lastPos.current = pos
    }

    const onEnd = () => {
      isDrawing.current = false
      lastPos.current = null
    }

    canvas.addEventListener("mousedown", onStart)
    canvas.addEventListener("mousemove", onMove)
    canvas.addEventListener("mouseup", onEnd)
    canvas.addEventListener("mouseleave", onEnd)
    canvas.addEventListener("touchstart", onStart, { passive: false })
    canvas.addEventListener("touchmove", onMove, { passive: false })
    canvas.addEventListener("touchend", onEnd)

    return () => {
      canvas.removeEventListener("mousedown", onStart)
      canvas.removeEventListener("mousemove", onMove)
      canvas.removeEventListener("mouseup", onEnd)
      canvas.removeEventListener("mouseleave", onEnd)
      canvas.removeEventListener("touchstart", onStart)
      canvas.removeEventListener("touchmove", onMove)
      canvas.removeEventListener("touchend", onEnd)
    }
  }, []) // sem dependências — registra uma única vez

  const handleColorChange = (c: string) => {
    colorRef.current = c
    setSelectedColor(c)
  }

  const undo = () => {
    if (historyRef.current.length <= 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    historyRef.current.pop()
    ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0)
    setCanUndo(historyRef.current.length > 1)
  }

  const clear = () => {
    if (historyRef.current.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.putImageData(historyRef.current[0], 0, 0)
    historyRef.current = [historyRef.current[0]]
    setCanUndo(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL("image/jpeg", 0.9))
  }

  return (
    <div className="space-y-3">
      {/* Toolbar compacta */}
      <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2">
        {/* Seletor de cores */}
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.label}
              onClick={() => handleColorChange(c.value)}
              className="h-8 w-8 rounded-full border-2 transition-transform active:scale-95"
              style={{
                backgroundColor: c.value,
                borderColor: selectedColor === c.value ? "white" : "rgba(255,255,255,0.2)",
                boxShadow: selectedColor === c.value ? "0 0 0 2px rgba(255,255,255,0.6)" : "none",
              }}
            />
          ))}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={undo}
            disabled={!canUndo}
            title="Desfazer"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-destructive"
            onClick={clear}
            title="Limpar tudo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="overflow-hidden rounded-lg border border-zinc-700 bg-black">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair"
          style={{ display: "block" }}
        />
      </div>

      <Button
        type="button"
        onClick={handleSave}
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
      >
        <Check className="mr-2 h-4 w-4" />
        Usar esta foto
      </Button>
    </div>
  )
}
