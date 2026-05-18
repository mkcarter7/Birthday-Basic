/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // React Strict Mode can help identify potential issues but is not required for DevTools.
  eslint: {
    // Don't fail build on ESLint errors in production
    ignoreDuringBuilds: true,
    dirs: ['pages', 'components', 'lib'],
  },
  typescript: {
    // Don't fail build on TypeScript errors (if you add TypeScript later)
    ignoreBuildErrors: true,
  },
  // Railway/Render configuration
  output: 'standalone', // Optimize for serverless/containerized deployments (Railway, Render, etc.)
};

module.exports = nextConfig;
