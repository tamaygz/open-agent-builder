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
      // Allow LAN access so other devices on the network can use the app
      allowedOrigins: [
        'localhost:3000',
        '*.app.github.dev',
        '192.168.1.27:3000',
        '192.168.1.*:3000',
      ],
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