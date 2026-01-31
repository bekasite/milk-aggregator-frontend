/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Remove the env config - use NEXT_PUBLIC_* instead in your app
  // env: {
  //   API_URL: process.env.API_URL || 'http://localhost:5000/api',
  // },
  
  // Fix for the global-error issue
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Only use rewrites in development, not in production
  async rewrites() {
    // Return empty array for production builds
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    // Only use rewrites in development
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
      },
    ];
  }
}

module.exports = nextConfig;