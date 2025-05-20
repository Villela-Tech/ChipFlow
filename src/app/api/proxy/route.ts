import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, method, headers, data } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    console.log('[PROXY] Iniciando requisição:', {
      url,
      method,
      hasHeaders: !!headers,
      hasData: !!data
    });

    // Adiciona timeout e retry
    const response = await axios({
      url,
      method: method || 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      data,
      timeout: 30000, // 30 segundos
      validateStatus: (status) => status < 500, // Rejeita apenas erros 500+
      maxRedirects: 5
    });

    console.log('[PROXY] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data
    });

    // Se a resposta não for bem-sucedida, loga mais detalhes
    if (response.status >= 400) {
      console.error('[PROXY] Erro na resposta:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });

      return NextResponse.json(
        {
          error: response.data?.error || 'Erro na requisição',
          message: response.data?.message || response.statusText,
          status: response.status
        },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('[PROXY] Erro crítico:', error);

    // Tratamento específico para erros do Axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Timeout
      if (axiosError.code === 'ECONNABORTED') {
        return NextResponse.json({
          error: 'Tempo limite excedido',
          message: 'A requisição demorou muito para responder. Por favor, tente novamente.'
        }, { status: 408 });
      }

      // Erro de rede
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
        return NextResponse.json({
          error: 'Erro de conexão',
          message: 'Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.'
        }, { status: 503 });
      }

      return NextResponse.json({
        error: 'Erro na requisição',
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response?.data
      }, { 
        status: axiosError.response?.status || 500 
      });
    }

    // Erro genérico
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const headers = request.nextUrl.searchParams.get('headers');
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  console.log(`[PROXY] Fazendo requisição GET para ${url}`);

  try {
    const requestHeaders = headers ? JSON.parse(headers) : {};
    console.log(`[PROXY] Headers:`, JSON.stringify(requestHeaders));
    
    const originalResponse = await fetch(url, {
      headers: requestHeaders,
      cache: 'no-store',
    });
    
    // Clone a resposta para poder usá-la várias vezes
    const responseForText = originalResponse.clone();
    
    // Verificar o content-type para decidir como processar a resposta
    const contentType = originalResponse.headers.get('Content-Type') || '';
    
    // Se o content-type indicar que não é JSON, vamos direto para o texto
    if (!contentType.includes('application/json')) {
      const textData = await responseForText.text();
      console.log(`[PROXY] Resposta em texto (${originalResponse.status}):`, textData.substring(0, 200) + (textData.length > 200 ? '...' : ''));
      
      return new NextResponse(textData, { 
        status: originalResponse.status,
        headers: {
          'Content-Type': contentType
        }
      });
    }
    
    // Se for JSON, retorna o JSON normalmente
    const jsonData = await originalResponse.json();
    return NextResponse.json(jsonData, { status: originalResponse.status });
    
  } catch (error) {
    console.error('[PROXY] Erro na requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 500 });
  }
} 