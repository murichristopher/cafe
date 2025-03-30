"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useSupabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasShownError, setHasShownError] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true
    let consecutiveErrors = 0
    
    const checkConnection = async () => {
      try {
        // Tentar fazer uma consulta simples para verificar conexão
        const { error } = await supabase.from("users").select("count").limit(1)
        
        if (error) {
          console.error("Erro de conexão com o Supabase:", error)
          if (isMounted) {
            consecutiveErrors++
            
            // Só considerar desconectado após 2 erros consecutivos
            // para evitar falsos alarmes
            if (consecutiveErrors >= 2) {
              setIsConnected(false)
              
              // Mostrar toast de erro apenas uma vez por sessão
              if (!hasShownError) {
                toast({
                  title: "Problema de conexão",
                  description: "Detectamos um problema de conexão com o banco de dados.",
                  variant: "destructive",
                })
                setHasShownError(true)
              }
            }
            
            setIsLoading(false)
          }
        } else {
          if (isMounted) {
            // Resetar contador de erros quando houver sucesso
            consecutiveErrors = 0
            setIsConnected(true)
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error("Erro ao verificar conexão Supabase:", error)
        if (isMounted) {
          consecutiveErrors++
          if (consecutiveErrors >= 2) {
            setIsConnected(false)
          }
          setIsLoading(false)
        }
      }
    }

    // Check connection immediately
    checkConnection()
    
    // Configure periodic connection checks
    const intervalId = setInterval(checkConnection, 30000) // Check every 30 seconds
    
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [toast, hasShownError])

  const retryConnection = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.from("users").select("count").limit(1)
      
      if (error) {
        console.error("Erro ao reconectar com o Supabase:", error)
        setIsConnected(false)
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet.",
          variant: "destructive",
        })
      } else {
        setIsConnected(true)
        toast({
          title: "Conexão restabelecida",
          description: "Conexão com o banco de dados foi restabelecida com sucesso.",
          variant: "default",
        })
        setHasShownError(false) // Resetar o estado após reconexão bem-sucedida
      }
    } catch (error) {
      console.error("Erro ao tentar reconectar:", error)
      setIsConnected(false)
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isConnected,
    isLoading,
    retryConnection
  }
} 