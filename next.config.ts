import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from "path";

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  output: "standalone",
  // Increase body size limit for uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Ensure pdfjs-dist asset files are included in standalone output
  // App Router entrypoints use the filesystem route key, so include both forms.
  outputFileTracingIncludes: {
    "/api/community/prepare": ["node_modules/pdfjs-dist/**"],
    "/api/pdf-thumbnail": ["node_modules/pdfjs-dist/**"],
    "app/api/community/prepare/route": ["node_modules/pdfjs-dist/**"],
    "app/api/pdf-thumbnail/route": ["node_modules/pdfjs-dist/**"],
  },
  serverExternalPackages: ["@napi-rs/canvas", "canvas"],
  transpilePackages: ["pdfjs-dist"],
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.pranakorn.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-darun.poomp5.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.discordapp.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.camphub.in.th',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.camphub.in.th',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.mytcas.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/r2-proxy/:path*",
        destination: "https://cdn.pranakorn.dev/:path*",
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Shim path2d-polyfill for pdfjs legacy build in server
    config.resolve.alias = {
      ...config.resolve.alias,
      'path2d-polyfill': path.resolve(__dirname, 'lib/polyfills/path2d-polyfill.js'),
    };

    // Handle canvas native modules for server-side rendering
    if (isServer) {
      config.externals.push({
        canvas: 'commonjs canvas',
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas',
      });
    }

    return config;
  },
};

export default withNextIntl(nextConfig);
