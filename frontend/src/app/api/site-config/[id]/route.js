export async function GET(request, { params }) {
  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '').replace(/\/$/, '');
  const { id } = await params;
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return Response.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const res = await fetch(`${base}/api/site-config/${id}/`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return Response.json(data, { status: res.status });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: `Site config fetch failed: ${e.message}` }, { status: 502 });
  }
}

export async function PATCH(request, { params }) {
  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '').replace(/\/$/, '');
  const { id } = await params;
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return Response.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const body = await request.json();
    const res = await fetch(`${base}/api/site-config/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return Response.json(data, { status: res.status });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: `Site config update failed: ${e.message}` }, { status: 502 });
  }
}
