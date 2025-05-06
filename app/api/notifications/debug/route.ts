import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log(`[DEBUG NOTIFICAÇÕES] Iniciando teste direto de inserção para ${userId || 'usuário não especificado'}`);
    
    // Resultado final do diagnóstico
    const resultado = {
      timestamp: new Date().toISOString(),
      permissoes: {
        select: null,
        insert: null,
        update: null,
        delete: null
      },
      testeInsercao: null,
      testeNotificacaoManual: null,
      rls: {
        ativo: null,
        politicas: []
      },
      estruturaTabela: null,
      sugestoes: []
    };
    
    // 1. Verificar permissões gerais
    try {
      console.log('[DEBUG NOTIFICAÇÕES] Verificando permissões...');
      
      // Verificar permissão de SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
        
      resultado.permissoes.select = {
        success: !selectError,
        error: selectError?.message || null
      };
      
      if (selectError) {
        resultado.sugestoes.push('Problema com permissão de SELECT. Verifique as políticas RLS.');
      }
      
      // Tentar inserção simples
      const { data: insertData, error: insertError } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId || 'test-user',
          title: 'Teste de DEBUG de permissão INSERT',
          message: 'Esta é uma notificação de teste para verificar permissões',
          type: 'system',
          read: false
        }]);
        
      resultado.permissoes.insert = {
        success: !insertError,
        error: insertError?.message || null
      };
      
      if (insertError) {
        if (insertError.message.includes('violates foreign key constraint')) {
          resultado.sugestoes.push('Erro de chave estrangeira. Verifique se o userId existe na tabela de usuários.');
        } else if (insertError.message.includes('permission denied')) {
          resultado.sugestoes.push('Problema com permissão de INSERT. Verifique as políticas RLS.');
        } else {
          resultado.sugestoes.push(`Problema desconhecido com INSERT: ${insertError.message}`);
        }
      }
      
      // Verificar estrutura da tabela usando SQL direto
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'notifications')
        .eq('table_schema', 'public');
        
      resultado.estruturaTabela = tableInfo || null;
      if (tableError) {
        resultado.sugestoes.push('Não foi possível obter a estrutura da tabela notifications.');
      }
      
    } catch (error) {
      console.error('[DEBUG NOTIFICAÇÕES] Erro ao verificar permissões:', error);
      resultado.permissoes.erro = error instanceof Error ? error.message : 'Erro desconhecido';
      resultado.sugestoes.push('Erro geral ao verificar permissões. Verifique a conexão com o Supabase.');
    }
    
    // 2. Testar inserção direta com bypass RLS
    try {
      console.log('[DEBUG NOTIFICAÇÕES] Tentando inserção direta com serviço...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId || 'test-user',
          title: 'Teste de DEBUG - Inserção Direta',
          message: `Teste de inserção direta às ${new Date().toLocaleTimeString()}`,
          type: 'system',
          read: false
        }])
        .select();
        
      resultado.testeInsercao = {
        success: !insertError && !!insertData,
        error: insertError?.message || null,
        data: insertData?.[0] || null
      };
      
      if (insertError) {
        if (insertError.code === '23503') {
          resultado.sugestoes.push('Erro de violação de chave estrangeira. Verifique se o userId existe.');
        } else if (insertError.code === '42501') {
          resultado.sugestoes.push('Erro de permissão. Seu token não tem permissão para inserir dados.');
        } else {
          resultado.sugestoes.push(`Erro ao inserir: ${insertError.message}`);
        }
      }
      
    } catch (error) {
      console.error('[DEBUG NOTIFICAÇÕES] Erro ao tentar inserção direta:', error);
      resultado.testeInsercao = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      resultado.sugestoes.push('Erro geral ao inserir notificação. Verifique a conexão com o Supabase.');
    }
    
    // 3. Criar uma notificação manual - testando também event_id
    if (userId) {
      try {
        console.log('[DEBUG NOTIFICAÇÕES] Tentando criar notificação manual com todos os campos...');
        
        const { data: manualData, error: manualError } = await supabase
          .from('notifications')
          .insert([{
            user_id: userId,
            title: 'Notificação de Teste Manual',
            message: 'Teste de todos os campos da tabela notifications',
            type: 'event_assignment',
            read: false,
            event_id: '36c290ab-28e2-4b69-9aec-3eab76113200' // ID fictício
          }])
          .select();
          
        resultado.testeNotificacaoManual = {
          success: !manualError && !!manualData,
          error: manualError?.message || null,
          data: manualData?.[0] || null
        };
        
        if (manualError) {
          if (manualError.message.includes('violates foreign key constraint')) {
            if (manualError.message.includes('event_id')) {
              resultado.sugestoes.push('Erro de chave estrangeira para event_id. Verifique se o evento especificado existe.');
            } else {
              resultado.sugestoes.push('Erro de chave estrangeira. Verifique os relacionamentos na tabela.');
            }
          } else {
            resultado.sugestoes.push(`Erro ao criar notificação manual: ${manualError.message}`);
          }
        }
        
      } catch (error) {
        console.error('[DEBUG NOTIFICAÇÕES] Erro ao criar notificação manual:', error);
        resultado.testeNotificacaoManual = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
      }
    }
    
    // 4. Verificar RLS com SQL direto em vez de RPC
    try {
      console.log('[DEBUG NOTIFICAÇÕES] Verificando configurações RLS...');
      
      // Verificar se RLS está ativo
      const { data: rlsData, error: rlsError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            c.relrowsecurity AS rls_ativo
          FROM pg_class c
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'notifications';
        `
      });
      
      if (rlsData && rlsData.length > 0) {
        resultado.rls.ativo = rlsData[0].rls_ativo;
      }
      
      if (rlsError) {
        console.error('[DEBUG NOTIFICAÇÕES] Erro ao verificar RLS:', rlsError);
        resultado.sugestoes.push('Não foi possível verificar se RLS está ativo devido a um erro. Verifique manualmente no console do Supabase.');
      }
      
      // Verificar políticas RLS
      const { data: policies, error: policiesError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            policyname,
            cmd,
            permissive
          FROM pg_policies
          WHERE tablename = 'notifications' AND schemaname = 'public';
        `
      });
      
      if (policies && policies.length > 0) {
        resultado.rls.politicas = policies;
      }
      
      if (policiesError) {
        console.error('[DEBUG NOTIFICAÇÕES] Erro ao verificar políticas RLS:', policiesError);
        resultado.sugestoes.push('Não foi possível obter as políticas RLS. Verifique manualmente no console do Supabase.');
      } else if (resultado.rls.ativo && (!policies || policies.length === 0)) {
        resultado.sugestoes.push('RLS está ativo mas não há políticas definidas. Isso pode bloquear todas as operações.');
      }
      
    } catch (error) {
      console.error('[DEBUG NOTIFICAÇÕES] Erro ao verificar RLS:', error);
      resultado.sugestoes.push('Erro ao verificar configurações RLS. Verifique manualmente no console do Supabase.');
    }
    
    // Adicionar sugestões finais
    if (!resultado.testeInsercao?.success && !resultado.testeNotificacaoManual?.success) {
      resultado.sugestoes.push('Nenhum teste de inserção teve sucesso. Recomendo verificar:');
      resultado.sugestoes.push('1. Se a tabela notifications existe e tem a estrutura correta');
      resultado.sugestoes.push('2. Se o token de serviço tem permissões adequadas');
      resultado.sugestoes.push('3. Se o RLS está configurado corretamente');
      resultado.sugestoes.push('4. Se há restrições de chave estrangeira impedindo inserções');
    }
    
    console.log('[DEBUG NOTIFICAÇÕES] Diagnóstico completo');
    
    return NextResponse.json({
      success: true,
      diagnosis: resultado
    });
    
  } catch (error) {
    console.error('[DEBUG NOTIFICAÇÕES] Erro fatal:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 