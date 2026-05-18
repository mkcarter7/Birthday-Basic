/**
 * Get the frontend URL (party website URL)
 * Uses environment variable if available, otherwise falls back to current origin
 * Works with Railway, Render, Vercel, and other platforms
 */
export default function getFrontendUrl() {
  // Check if NEXT_PUBLIC_FRONTEND_URL is set (for custom deployments)
  if (typeof window !== 'undefined') {
    // Client-side: use current origin or environment variable
    return process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
  }
  // Server-side: use environment variable or fallback
  if (process.env.NEXT_PUBLIC_FRONTEND_URL) {
    return process.env.NEXT_PUBLIC_FRONTEND_URL;
  }
  // Fallback for Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Default fallback (should be overridden by environment variable)
  return 'https://localhost:3000';
}
