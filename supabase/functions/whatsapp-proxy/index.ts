import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionAPIConfig {
  url: string;
  key: string;
}

// Buscar credenciais Evolution API usando função RPC (bypass RLS)
async function getEvolutionAPIConfig(supabase: any): Promise<EvolutionAPIConfig | null> {
  try {
    // Usar função RPC que usa SECURITY DEFINER para bypass RLS
    const { data, error } = await supabase.rpc('get_evolution_api_config');

    if (error) {
      console.error('Erro ao buscar configurações Evolution API via RPC:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const config = data[0];
    if (!config.url || !config.key) {
      return null;
    }

    return {
      url: config.url,
      key: config.key,
    } as EvolutionAPIConfig;
  } catch (error) {
    console.error('Erro ao buscar configurações Evolution API:', error);
    return null;
  }
}

// Verificar se usuário é psicólogo e obter seu ID
async function getPsicologoId(supabase: any, userId: string): Promise<string | null> {
  try {
    // Verificar se o perfil existe (user.id já é o psicologo_id)
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar perfil:', error);
      // Mesmo com erro, retornar userId pois user.id = profiles.id
      return userId;
    }

    // Se não encontrou perfil, retornar null
    if (!data) {
      return null;
    }

    // Retornar o ID (que é o mesmo que userId)
    return data.id;
  } catch (error) {
    console.error('Erro ao obter psicologo_id:', error);
    // Em caso de erro, tentar retornar userId diretamente
    return userId;
  }
}

// Verificar se instância pertence ao psicólogo
async function verifyInstanceOwnership(
  supabase: any,
  instanceName: string,
  psicologoId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('psicologo_id')
    .eq('instance_name', instanceName)
    .single();

  if (error || !data) {
    return false;
  }

  return data.psicologo_id === psicologoId;
}

// Fazer proxy para Evolution API
async function proxyToEvolutionAPI(
  config: EvolutionAPIConfig,
  method: string,
  path: string,
  body?: any
): Promise<Response> {
  // Garantir que a URL não tenha barra dupla
  const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${apiPath}`;
  
  // Evolution API geralmente usa apenas o header 'apikey'
  const headers: HeadersInit = {
    'apikey': config.key,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log('Fazendo requisição para Evolution API:', { url, method, hasBody: !!body });
    const response = await fetch(url, options);
    const data = await response.text();
    
    // Log para debug
    if (!response.ok) {
      console.error('Erro na resposta Evolution API:', {
        status: response.status,
        statusText: response.statusText,
        data: data.substring(0, 500), // Primeiros 500 caracteres
      });
    }
    
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Erro ao fazer proxy para Evolution API:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao conectar com Evolution API', details: error?.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Obter token JWT do header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Criar cliente Supabase com token do usuário para RLS funcionar
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar credenciais Evolution API
    const evolutionConfig = await getEvolutionAPIConfig(supabase);
    if (!evolutionConfig) {
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada. Configure no painel Admin.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter psicologo_id
    const psicologoId = await getPsicologoId(supabase, user.id);
    if (!psicologoId) {
      return new Response(
        JSON.stringify({ error: 'Perfil de psicólogo não encontrado' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse da URL
    const url = new URL(req.url);
    const pathname = url.pathname.replace('/whatsapp-proxy', '');

    // Roteamento
    if (pathname.startsWith('/instance/create') && req.method === 'POST') {
      const body = await req.json();
      const instanceName = body.instanceName || `psicologo-${psicologoId}`;

      // Verificar se instância já existe
      const { data: existingInstance } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('instance_name', instanceName)
        .single();

      if (existingInstance) {
        return new Response(
          JSON.stringify({ error: 'Instância já existe' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Criar instância na Evolution API
      // Evolution API requer o campo 'integration' (WHATSAPP-BAILEYS ou WHATSAPP-BUSINESS)
      const evolutionResponse = await proxyToEvolutionAPI(
        evolutionConfig,
        'POST',
        `/instance/create`,
        { 
          instanceName, 
          integration: 'WHATSAPP-BAILEYS', // Usar BAILEYS como padrão
          qrcode: true 
        }
      );

      if (!evolutionResponse.ok) {
        return evolutionResponse;
      }

      // Salvar instância no banco
      const { data: instanceData, error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          psicologo_id: psicologoId,
          instance_name: instanceName,
          status: 'connecting',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao salvar instância:', dbError);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar instância no banco' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(instanceData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter QR code
    if (pathname.startsWith('/instance/connect/') && req.method === 'GET') {
      const instanceName = pathname.replace('/instance/connect/', '');

      if (!(await verifyInstanceOwnership(supabase, instanceName, psicologoId))) {
        return new Response(
          JSON.stringify({ error: 'Instância não encontrada ou sem permissão' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return proxyToEvolutionAPI(
        evolutionConfig,
        'GET',
        `/instance/connect/${instanceName}`
      );
    }

    // Obter status de conexão
    if (pathname.startsWith('/instance/connectionState/') && req.method === 'GET') {
      const instanceName = pathname.replace('/instance/connectionState/', '');

      if (!(await verifyInstanceOwnership(supabase, instanceName, psicologoId))) {
        return new Response(
          JSON.stringify({ error: 'Instância não encontrada ou sem permissão' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return proxyToEvolutionAPI(
        evolutionConfig,
        'GET',
        `/instance/connectionState/${instanceName}`
      );
    }

    // Deletar instância
    if (pathname.startsWith('/instance/delete/') && req.method === 'DELETE') {
      const instanceName = pathname.replace('/instance/delete/', '');

      if (!(await verifyInstanceOwnership(supabase, instanceName, psicologoId))) {
        return new Response(
          JSON.stringify({ error: 'Instância não encontrada ou sem permissão' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Deletar na Evolution API
      const evolutionResponse = await proxyToEvolutionAPI(
        evolutionConfig,
        'DELETE',
        `/instance/delete/${instanceName}`
      );

      if (!evolutionResponse.ok) {
        return evolutionResponse;
      }

      // Deletar do banco
      await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('instance_name', instanceName);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enviar mensagem
    if (pathname.startsWith('/message/sendText/') && req.method === 'POST') {
      const instanceName = pathname.replace('/message/sendText/', '');
      const body = await req.json();

      if (!(await verifyInstanceOwnership(supabase, instanceName, psicologoId))) {
        return new Response(
          JSON.stringify({ error: 'Instância não encontrada ou sem permissão' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return proxyToEvolutionAPI(
        evolutionConfig,
        'POST',
        `/message/sendText/${instanceName}`,
        body
      );
    }

    // Configurar webhook
    if (pathname.startsWith('/webhook/set/') && req.method === 'POST') {
      const instanceName = pathname.replace('/webhook/set/', '');
      const body = await req.json();

      if (!(await verifyInstanceOwnership(supabase, instanceName, psicologoId))) {
        return new Response(
          JSON.stringify({ error: 'Instância não encontrada ou sem permissão' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const evolutionResponse = await proxyToEvolutionAPI(
        evolutionConfig,
        'POST',
        `/webhook/set/${instanceName}`,
        body
      );

      if (!evolutionResponse.ok) {
        return evolutionResponse;
      }

      // Atualizar webhook_url no banco
      if (body.url) {
        await supabase
          .from('whatsapp_instances')
          .update({ webhook_url: body.url })
          .eq('instance_name', instanceName);
      }

      return evolutionResponse;
    }

    // Rota não encontrada
    return new Response(
      JSON.stringify({ error: 'Rota não encontrada' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

