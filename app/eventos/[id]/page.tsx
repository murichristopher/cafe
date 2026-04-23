"use client"

import { useState, useEffect, useRef, use } from "react"
import { Camera, Upload, CheckCircle, Loader2, X, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoAnnotator } from "@/components/photo-annotator"
import Image from "next/image"

type Evento = {
  id: string
  title: string
  description: string
  date: string
  location: string
  event_image?: string | null
  status: string
}

export default function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params)

  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoAnotada, setFotoAnotada] = useState<string | null>(null)
  const [showAnnotator, setShowAnnotator] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/eventos/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.evento) setEvento(data.evento)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [eventId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoAnotada(null)
    setShowAnnotator(false)
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleAnnotationSave = (dataUrl: string) => {
    setFotoAnotada(dataUrl)
    setShowAnnotator(false)
  }

  const dataURLtoBlob = (dataUrl: string) => {
    const [header, data] = dataUrl.split(",")
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg"
    const binary = atob(data)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
    return new Blob([array], { type: mime })
  }

  const uploadFoto = async (): Promise<string | null> => {
    const finalDataUrl = fotoAnotada || fotoPreview
    if (!finalDataUrl) return null

    const blob = dataURLtoBlob(finalDataUrl)
    const formData = new FormData()
    formData.append("file", blob, `registro_${eventId}_${Date.now()}.jpg`)
    formData.append("event_id", eventId)

    const response = await fetch("/api/eventos/upload-foto", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.url || null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!nome.trim() || !telefone.trim()) {
      setError("Nome e telefone são obrigatórios.")
      return
    }

    setSubmitting(true)
    try {
      let foto_url: string | null = null
      if (fotoPreview || fotoAnotada) {
        foto_url = await uploadFoto()
      }

      const response = await fetch(`/api/eventos/${eventId}/registros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), telefone: telefone.trim(), foto_url }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao enviar resposta")
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (notFound || !evento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold">Evento não encontrado</p>
          <p className="text-muted-foreground">O link pode estar incorreto ou o evento foi removido.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Resposta enviada!</h2>
          <p className="text-muted-foreground">
            Obrigado, <strong>{nome}</strong>! Seu registro foi recebido com sucesso.
          </p>
          <p className="text-sm text-muted-foreground">{evento.title}</p>
        </div>
      </div>
    )
  }

  const dateStr = new Date(evento.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Cabeçalho do evento */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 mx-auto">
            <span className="text-2xl">☕</span>
          </div>
          <h1 className="text-2xl font-bold">{evento.title}</h1>
          <p className="text-sm text-muted-foreground">
            {dateStr} · {evento.location}
          </p>
          {evento.event_image && (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <img src={evento.event_image} alt={evento.title} className="w-full h-40 object-cover" />
            </div>
          )}
        </div>

        {/* Formulário */}
        <Card className="border-zinc-800 bg-[#1a1a1a]">
          <CardHeader>
            <CardTitle>Faça seu registro</CardTitle>
            <CardDescription>Preencha seus dados para confirmar presença.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-[#111] border-zinc-700"
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="bg-[#111] border-zinc-700"
                  placeholder="(00) 00000-0000"
                  type="tel"
                  required
                />
              </div>

              {/* Upload de foto */}
              <div className="grid gap-2">
                <Label>Foto (opcional)</Label>

                {!fotoPreview && !fotoAnotada && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-zinc-700 border-dashed h-24 flex-col gap-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Escolher arquivo</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-zinc-700 border-dashed h-24 flex-col gap-1"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = "image/*"
                        input.capture = "environment"
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (!file) return
                          setFotoFile(file)
                          setFotoAnotada(null)
                          setShowAnnotator(false)
                          const reader = new FileReader()
                          reader.onload = (ev) => setFotoPreview(ev.target?.result as string)
                          reader.readAsDataURL(file)
                        }
                        input.click()
                      }}
                    >
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Tirar foto</span>
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Preview e anotador */}
                {fotoPreview && !showAnnotator && (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                      <img
                        src={fotoAnotada || fotoPreview}
                        alt="Foto selecionada"
                        className="w-full max-h-64 object-contain bg-black"
                      />
                      {fotoAnotada && (
                        <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                          Com anotações
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 h-7 w-7"
                        onClick={() => {
                          setFotoFile(null)
                          setFotoPreview(null)
                          setFotoAnotada(null)
                          setShowAnnotator(false)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-zinc-700 text-xs"
                      onClick={() => setShowAnnotator(true)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      {fotoAnotada ? "Editar anotações" : "Anotar / Rubricar"}
                    </Button>
                  </div>
                )}

                {/* Anotador */}
                {fotoPreview && showAnnotator && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Desenhe sobre a foto:</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => setShowAnnotator(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <PhotoAnnotator
                      imageUrl={fotoAnotada || fotoPreview}
                      onSave={handleAnnotationSave}
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Confirmar Registro"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Eleve Café & Cia
        </p>
      </div>
    </div>
  )
}
