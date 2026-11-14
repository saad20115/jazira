import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

interface WebpackConfigWithResolve {
  resolve: {
    extensionAlias?: Record<string, string[]>
  }
  watchOptions?: {
    ignored?: string[] | RegExp
  }
}

const baseSecurityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    globalNotFound: true,
  },
  outputFileTracingExcludes: {
    '*': ['./media/**', './videos/**', './storage/**'],
  },
  images: {
    remotePatterns: [],
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/images/**',
      },
      {
        pathname: '/brand/**',
      },
    ],
  },
  headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: baseSecurityHeaders,
      },
      {
        // Security H3b (P3-T5): the KTX2 transcoding worker, and only it, gets its own CSP. The
        // proxy skips /systems/, so this is the only CSP on that response.
        source: '/systems/:release/basis/ktx2-worker.js',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'none'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self'",
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        source: '/admin',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
      },
      {
        source: '/api/:collection(media|videos)/file/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; sandbox",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ])
  },
  webpack: (webpackConfig: WebpackConfigWithResolve) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    webpackConfig.watchOptions = {
      ...webpackConfig.watchOptions,
      ignored: ['**/node_modules/**', '**/media/**', '**/videos/**', '**/storage/**'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
