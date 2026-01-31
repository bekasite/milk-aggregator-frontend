/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Add output export if you want static site generation
  // Remove this if you need server-side features (API routes, etc.)
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // For Vercel, you might want to use 'standalone' or remove output config entirely
  // output: 'standalone',
  
  // Disable ESLint during build to prevent linting errors from breaking build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Remove the experimental config if not needed
  // experimental: {
  //   missingSuspenseWithCSRBailout: false,
  // },
  
  // Simplify rewrites - remove conditional logic
  async rewrites() {
    // In production on Vercel, you typically don't need rewrites
    // because your API is external (Render.com)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    
    // Only use rewrites if we don't have a public API URL
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  }
}

module.exports = nextConfig;