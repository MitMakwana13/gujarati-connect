import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(req, params.path);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(req, params.path);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(req, params.path);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(req, params.path);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(req, params.path);
}

async function proxyRequest(req: NextRequest, pathArray: string[]) {
  try {
    const targetPath = pathArray.join('/');
    const searchParams = req.nextUrl.search;
    const targetUrl = `${API_URL}/${targetPath}${searchParams}`;

    // Forward headers, passing the Authorization header from the client through
    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const auth = req.headers.get('authorization');
    if (auth) headers.set('authorization', auth);

    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    let body: BodyInit | undefined = undefined;

    if (isMutation && contentType?.includes('application/json')) {
      const text = await req.text();
      body = text || undefined;
    } else if (isMutation) {
      body = req.body as BodyInit | undefined;
    }

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    responseHeaders.set('x-bff-proxied', 'true');
    // Forward Set-Cookie from API (for refresh token cookie)
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) responseHeaders.set('set-cookie', setCookie);

    if (res.headers.get('content-type')?.includes('application/json')) {
      const resBody = await res.json();
      return NextResponse.json(resBody, { status: res.status, headers: responseHeaders });
    } else {
      const resBody = await res.text();
      return new NextResponse(resBody, { status: res.status, headers: responseHeaders });
    }
  } catch (error) {
    console.error('BFF Proxy Error:', error);
    return NextResponse.json(
      { errors: [{ message: 'Could not reach the API server. Is it running on port 4000?' }] },
      { status: 502 },
    );
  }
}
