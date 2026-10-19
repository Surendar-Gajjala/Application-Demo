// Netlify Edge Function: the production counterpart of the Vite `/enterprise` proxy in
// vite.config.ts. Forwards /enterprise/* to the Enterprise platform API and adds the Bearer
// token server-side, so the token never reaches the browser or the published files.
//
// Netlify environment variables (Site configuration → Environment variables):
//   ENTERPRISE_API_HOST   e.g. https://<enterprise-host>   (no trailing slash)
//   ENTERPRISE_API_TOKEN  Bearer token (expires after ~24h; update it here, no redeploy needed)

declare const Netlify: { env: { get(name: string): string | undefined } };

const json = (status: number, message: string) =>
  new Response(JSON.stringify({ message }), { status, headers: { 'Content-Type': 'application/json' } });

export default async (request: Request): Promise<Response> => {
  const host = Netlify.env.get('ENTERPRISE_API_HOST')?.replace(/\/+$/, '');
  const token = Netlify.env.get('ENTERPRISE_API_TOKEN');
  if (!host || !token) return json(500, 'The Enterprise proxy is not configured.');

  const url = new URL(request.url);
  const target = `${host}/api/v1/platform${url.pathname.replace(/^\/enterprise/, '')}${url.search}`;

  // Forward only what the API needs; never the visitor's cookies.
  const headers = new Headers({ Accept: 'application/json', Authorization: `Bearer ${token}` });
  const contentType = request.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
  });

  // fetch() has already decoded the body, so drop the upstream encoding/length headers.
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
};

export const config = { path: '/enterprise/*' };
