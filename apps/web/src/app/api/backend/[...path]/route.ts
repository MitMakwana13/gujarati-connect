import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Vercel must set this to the Fastify API base, including /api/v1.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1').replace(/\/+$/, '');

const REQUEST_HEADERS_TO_FORWARD = ['authorization', 'content-type', 'cookie'];
const RESPONSE_HEADERS_TO_FORWARD = ['content-type', 'set-cookie', 'retry-after', 'www-authenticate', 'x-request-id'];
const BODYLESS_STATUSES = new Set([204, 304]);

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
    const targetPath = pathArray.map((segment) => encodeURIComponent(segment)).join('/');
    const targetUrl = `${API_URL}/${targetPath}${req.nextUrl.search}`;

    const headers = new Headers();
    for (const headerName of REQUEST_HEADERS_TO_FORWARD) {
      const value = req.headers.get(headerName);
      if (value) headers.set(headerName, value);
    }

    const allowsBody = !['GET', 'HEAD'].includes(req.method);
    const bodyBuffer = allowsBody ? await req.arrayBuffer() : undefined;
    const body = bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined;

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    const responseHeaders = new Headers();
    responseHeaders.set('x-bff-proxied', 'true');

    for (const headerName of RESPONSE_HEADERS_TO_FORWARD) {
      const value = res.headers.get(headerName);
      if (value) responseHeaders.set(headerName, value);
    }
    responseHeaders.set('cache-control', 'no-store');
    responseHeaders.set('vary', 'Authorization, Cookie');

    if (BODYLESS_STATUSES.has(res.status)) {
      return new NextResponse(null, { status: res.status, headers: responseHeaders });
    }

    const resBody = await res.arrayBuffer();
    return new NextResponse(resBody, { status: res.status, headers: responseHeaders });
  } catch (error) {
    console.error('BFF Proxy Error:', error);
    return NextResponse.json(
      { errors: [{ message: 'Could not reach the API server. Please try again shortly.' }] },
      { status: 502, headers: { 'cache-control': 'no-store' } },
    );
  }
}
