export async function GET(request) {
  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '').replace(/\/$/, '');
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain') || '';

  try {
    const res = await fetch(
      `${base}/api/parties/check_subdomain/?subdomain=${encodeURIComponent(subdomain)}`,
      { cache: 'no-store' },
    );
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ available: false, reason: 'Availability check unavailable.' }, { status: 502 });
  }
}
