export async function GET(request) {
  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '').replace(/\/$/, '');
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return Response.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const res = await fetch(
      `${base}/api/site-config/${qs ? `?${qs}` : ''}`,
      { headers: { Authorization: authHeader }, cache: 'no-store' },
    );
    const data = await res.json();
    if (!res.ok) return Response.json(data, { status: res.status });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: `Site config list failed: ${e.message}` }, { status: 502 });
  }
}
