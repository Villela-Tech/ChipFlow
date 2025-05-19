import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, method, headers, data } = body;

    console.log('[PROXY] Iniciando requisição:', {
      url,
      method,
      hasHeaders: !!headers,
      hasData: !!data
    });

    const response = await axios({
      url,
      method: method || 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      data,
      timeout: 30000, // 30 segundos de timeout
      validateStatus: () => true,
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
      return NextResponse.json({
        error: 'Erro na requisição',
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response?.data
      }, { 
        status: axiosError.response?.status || 500 
      });
    }

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
      
      // Se for texto contendo um QR code, tenta formatá-lo como JSON para facilitar o processamento no front
      if (textData.includes('qrcode') || url.includes('/whatsapp/')) {
        try {
          // Tenta extrair o QR code do texto se possível
          const qrMatch = textData.match(/"qrcode"\s*:\s*"([^"]+)"/);
          if (qrMatch && qrMatch[1]) {
            return NextResponse.json({ qrcode: qrMatch[1] }, { status: 200 });
          }
        } catch (e) {
          console.error('[PROXY] Erro ao tentar extrair QR code do texto:', e);
        }
      }
      
      return new NextResponse(textData, { 
        status: originalResponse.status,
        headers: {
          'Content-Type': contentType
        }
      });
    }
    
    try {
      const data = await originalResponse.json();
      console.log(`[PROXY] Resposta JSON (${originalResponse.status}):`, JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : ''));
      return NextResponse.json(data, { status: originalResponse.status });
    } catch (jsonError) {
      console.error(`[PROXY] Erro ao parsear JSON:`, jsonError);
      const textData = await responseForText.text();
      console.log(`[PROXY] Resposta em texto (${originalResponse.status}):`, textData.substring(0, 200) + (textData.length > 200 ? '...' : ''));
      
      return new NextResponse(textData, { 
        status: originalResponse.status,
        headers: {
          'Content-Type': contentType
        }
      });
    }
  } catch (error) {
    console.error('[PROXY] Erro no proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 