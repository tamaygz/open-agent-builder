/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // Needed for Codespaces preview domains to avoid "Invalid Server Actions request".
      allowedOrigins: ['localhost:3000', '*.app.github.dev'],
    },
  },
  // Mark server-only packages for Next.js 16+
  serverExternalPackages: [
    '@langchain/langgraph',
    '@langchain/langgraph-checkpoint-redis',
    'redis',
    '@redis/client',
    '@e2b/code-interpreter',
    'e2b',
  ],
}

module.exports = nextConfig