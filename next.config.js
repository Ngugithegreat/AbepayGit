/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to fix a build error with Genkit's tracing dependencies.
    // Since we are not using tracing, we can safely exclude them from the bundle.
    if (isServer) {
      config.externals.push(
        '@opentelemetry/sdk-node',
        'require-in-the-middle',
        '@opentelemetry/instrumentation'
      );
    }
    return config;
  },
};

module.exports = nextConfig;
