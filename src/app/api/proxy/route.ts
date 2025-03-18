import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method = 'GET', data, headers = {} } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[PROXY] Fazendo requisição ${method} para ${url}`);
    
    if (data) {
      console.log(`[PROXY] Dados da requisição:`, JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : ''));
    }
    
    console.log(`[PROXY] Headers:`, JSON.stringify(headers));

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      cache: 'no-store',
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    const originalResponse = await fetch(url, requestOptions);
    
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
      // Tentativa de obter dados JSON
      const responseData = await originalResponse.json();
      console.log(`[PROXY] Resposta JSON (${originalResponse.status}):`, JSON.stringify(responseData).substring(0, 200) + (JSON.stringify(responseData).length > 200 ? '...' : ''));
      return NextResponse.json(responseData, { status: originalResponse.status });
    } catch (jsonError) {
      // Se não for JSON, obtém o texto da resposta clonada
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