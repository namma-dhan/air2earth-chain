/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Workers deployment via @opennextjs/cloudflare.
  // Build & deploy: pnpm deploy
  // Preview locally: pnpm preview

  // Required: disable Next.js image optimization — use Cloudflare Image Resizing instead
  images: {
    unoptimized: true,
  },

  // Webpack config for Cesium compatibility
  webpack: (config, { isServer }) => {
    // Cesium uses some Node.js modules that need to be polyfilled or ignored in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        stream: false,
      };
    }

    // Handle Cesium's use of 'require' and AMD-style defines
    config.module.rules.push({
      test: /\.js$/,
      include: /cesium/,
      type: "javascript/auto",
    });

    return config;
  },

  // TypeScript strict mode is already configured in tsconfig
  typescript: {
    // Allow production builds even if there are type errors during migration
    ignoreBuildErrors: false,
  },

  // ESLint during builds
  eslint: {
    // Allow production builds to proceed even with lint warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

// Enable Cloudflare bindings during `next dev` (no-op in CI/production builds)
if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare')
    .then(({ initOpenNextCloudflareForDev }) => initOpenNextCloudflareForDev())
    .catch(() => {});
}
