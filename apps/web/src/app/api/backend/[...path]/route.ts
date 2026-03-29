import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000/api/v1";

const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only-gg";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

async function proxyRequest(req: NextRequest, pathArray: string[]) {
  try {
    const token = await getToken({ req, secret });
    const targetPath = pathArray.join("/");
    const searchParams = req.nextUrl.search;
    
    // Construct the actual backend URL
    const targetUrl = `${API_URL}/${targetPath}${searchParams}`;

    // Collect headers from incoming request, but specifically replace Auth header
    const headers = new Headers(req.headers);
    
    // Strip headers that could cause issues when proxying
    headers.delete('host');
    headers.delete('connection');
    
    if (token?.accessToken) {
      headers.set("Authorization", `Bearer ${token.accessToken}`);
    }

    // Prepare body if it's a mutation req
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    let body = undefined;

    if (isMutation && req.headers.get("content-type")?.includes("application/json")) {
      const text = await req.text();
      body = text ? text : undefined;
    } else if (isMutation) {
      body = req.body; // For formData/blobs
    }

    const res = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
        cache: 'no-store' // Do not cache proxied requests inside the Next cache
    });

    // Pass the exact status back
    const responseHeaders = new Headers(res.headers);
    responseHeaders.set("x-bff-proxied", "true");

    // Read the body
    let resBody: any;
    if (res.headers.get("content-type")?.includes("application/json")) {
      resBody = await res.json();
      return NextResponse.json(resBody, {
        status: res.status,
        headers: responseHeaders,
      });
    } else {
      resBody = await res.text();
      return new NextResponse(resBody, {
        status: res.status,
        headers: responseHeaders,
      });
    }

  } catch (error) {
    console.error("BFF Proxy Error:", error);
    return NextResponse.json(
      { errors: [{ message: "Internal BFF proxy error" }] },
      { status: 500 }
    );
  }
}
