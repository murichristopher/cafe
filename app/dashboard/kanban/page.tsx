"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { DndContext, closestCenter, DragEndEvent, DragOverEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useToast } from "@/hooks/use-toast"

type KanbanTask = {
  id: string
  title: string
  description?: string
  column_name: string
  position: number
  assigned_to?: string
}

type Column = {
  id: string
  title: string
}

const COLUMNS: Column[] = [
  { id: "todo", title: "A Fazer" },
  { id: "doing", title: "Em Progresso" },
  { id: "done", title: "Concluído" },
]

function DroppableColumn({
  column,
  tasks,
  onDelete,
  onEdit,
}: {
  column: Column
  tasks: KanbanTask[]
  onDelete: (id: string) => void
  onEdit: (task: KanbanTask) => void
}) {
  const { setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{column.title}</h2>
        <p className="text-xs text-muted-foreground">{tasks.length} tarefas</p>
      </div>
      <div ref={setNodeRef} className="flex-1 bg-zinc-900 rounded-lg p-4 min-h-[400px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <SortableTask key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} />
            ))}
            {tasks.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">Nenhuma tarefa</div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

function SortableTask({
  task,
  onDelete,
  onEdit,
}: {
  task: KanbanTask
  onDelete: (id: string) => void
  onEdit: (task: KanbanTask) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="group">
      <Card
        className="bg-zinc-800 border-zinc-700 hover:border-yellow-400 transition-colors cursor-pointer"
        onClick={() => onEdit(task)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-white truncate">{task.title}</h4>
              {task.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>}
              {task.assigned_to && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-yellow-400">👤 {task.assigned_to}</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
            >
              <Trash2 className="h-3 w-3 text-red-400" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function KanbanPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === "admin"

  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", description: "", column_name: "todo", assigned_to: "" })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/kanban")
      const data = await res.json()
      if (data.tasks) {
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error)
      toast({
        title: "Erro ao carregar tarefas",
        description: "Não foi possível carregar as tarefas do kanban.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchTasks()
    }
  }, [isAdmin])

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para a tarefa.",
        variant: "destructive",
      })
      return
    }

    try {
      const maxPosition = tasks.filter((t) => t.column_name === newTask.column_name).length

      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, position: maxPosition }),
      })

      const data = await res.json()
      if (data.task) {
        setTasks([...tasks, data.task])
        setNewTask({ title: "", description: "", column_name: "todo", assigned_to: "" })
        setIsDialogOpen(false)
        toast({
          title: "Tarefa criada",
          description: "A tarefa foi adicionada com sucesso.",
        })
      }
    } catch (error) {
      console.error("Erro ao criar tarefa:", error)
      toast({
        title: "Erro ao criar tarefa",
        description: "Não foi possível criar a tarefa.",
        variant: "destructive",
      })
    }
  }

  const handleEditTask = async () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para a tarefa.",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/kanban", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTask),
      })

      const data = await res.json()
      if (data.task) {
        setTasks(tasks.map((t) => (t.id === data.task.id ? data.task : t)))
        setEditingTask(null)
        setIsEditDialogOpen(false)
        toast({
          title: "Tarefa atualizada",
          description: "As alterações foram salvas com sucesso.",
        })
      }
    } catch (error) {
      console.error("Erro ao editar tarefa:", error)
      toast({
        title: "Erro ao editar tarefa",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      })
    }
  }

  const handleOpenEditDialog = (task: KanbanTask) => {
    setEditingTask({ ...task })
    setIsEditDialogOpen(true)
  }

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/kanban?id=${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== id))
        toast({
          title: "Tarefa excluída",
          description: "A tarefa foi removida com sucesso.",
        })
      }
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error)
      toast({
        title: "Erro ao excluir tarefa",
        description: "Não foi possível excluir a tarefa.",
        variant: "destructive",
      })
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Check if dropping over a column
    let targetColumn = activeTask.column_name
    const overTask = tasks.find((t) => t.id === overId)
    
    if (overTask) {
      targetColumn = overTask.column_name
    } else if (overId.startsWith("column-")) {
      targetColumn = overId.replace("column-", "")
    }

    if (activeTask.column_name === targetColumn) return

    // Move task to new column immediately for visual feedback
    setTasks((prevTasks) => {
      const newTasks = prevTasks.map((task) => {
        if (task.id === activeId) {
          return { ...task, column_name: targetColumn }
        }
        return task
      })

      // Recalculate positions
      const tasksByColumn: Record<string, KanbanTask[]> = {}
      newTasks.forEach((task) => {
        if (!tasksByColumn[task.column_name]) tasksByColumn[task.column_name] = []
        tasksByColumn[task.column_name].push(task)
      })

      const reorderedTasks: KanbanTask[] = []
      Object.entries(tasksByColumn).forEach(([colName, colTasks]) => {
        colTasks.forEach((task, idx) => {
          task.position = idx
          reorderedTasks.push(task)
        })
      })

      return reorderedTasks
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Determine target column and position
    let targetColumn = activeTask.column_name
    let insertIndex = -1
    
    const overTask = tasks.find((t) => t.id === overId)
    
    if (overTask) {
      targetColumn = overTask.column_name
      insertIndex = tasks.filter(t => t.column_name === targetColumn).findIndex(t => t.id === overId)
    } else if (overId.startsWith("column-")) {
      targetColumn = overId.replace("column-", "")
    }

    // Reorganize tasks
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks]
      const activeIndex = newTasks.findIndex((t) => t.id === activeId)
      const [movedTask] = newTasks.splice(activeIndex, 1)
      movedTask.column_name = targetColumn

      if (insertIndex >= 0) {
        const columnTasks = newTasks.filter(t => t.column_name === targetColumn)
        const actualIndex = newTasks.indexOf(columnTasks[insertIndex])
        newTasks.splice(actualIndex, 0, movedTask)
      } else {
        newTasks.push(movedTask)
      }

      // Recalculate positions per column
      const tasksByColumn: Record<string, KanbanTask[]> = {}
      newTasks.forEach((task) => {
        if (!tasksByColumn[task.column_name]) tasksByColumn[task.column_name] = []
        tasksByColumn[task.column_name].push(task)
      })

      const reorderedTasks: KanbanTask[] = []
      Object.entries(tasksByColumn).forEach(([colName, colTasks]) => {
        colTasks.forEach((task, idx) => {
          task.position = idx
          reorderedTasks.push(task)
        })
      })

      return reorderedTasks
    })

    // Persist to backend
    try {
      const reorderedForBackend = tasks.map((t) => ({ id: t.id, column_name: t.column_name, position: t.position }))
      
      await fetch("/api/kanban/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: reorderedForBackend }),
      })
    } catch (error) {
      console.error("Erro ao reordenar tarefas:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a nova ordem.",
        variant: "destructive",
      })
      // Refetch to restore correct state
      fetchTasks()
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Kanban</h1>
        <p className="mt-4">Acesso restrito: apenas administradores podem ver o Kanban.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kanban</h1>
          <p className="text-sm text-muted-foreground mt-1">Kanban compartilhado entre administradores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Título</label>
                <Input
                  placeholder="Digite o título da tarefa"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Descrição</label>
                <Textarea
                  placeholder="Digite a descrição (opcional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Responsável</label>
                <Input
                  placeholder="Nome do responsável (opcional)"
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Coluna</label>
                <select
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 p-2 text-sm"
                  value={newTask.column_name}
                  onChange={(e) => setNewTask({ ...newTask, column_name: e.target.value })}
                >
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black" onClick={handleCreateTask}>
                  Criar Tarefa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Título</label>
                <Input
                  placeholder="Digite o título da tarefa"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Descrição</label>
                <Textarea
                  placeholder="Digite a descrição (opcional)"
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Responsável</label>
                <Input
                  placeholder="Nome do responsável (opcional)"
                  value={editingTask.assigned_to || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Coluna</label>
                <select
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 p-2 text-sm"
                  value={editingTask.column_name}
                  onChange={(e) => setEditingTask({ ...editingTask, column_name: e.target.value })}
                >
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black" onClick={handleEditTask}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.column_name === column.id).sort((a, b) => a.position - b.position)

            return (
              <DroppableColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                onDelete={handleDeleteTask}
                onEdit={handleOpenEditDialog}
              />
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
