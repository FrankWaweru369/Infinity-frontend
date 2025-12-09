const nextConfig = {
  reactStrictMode: true,
  distDir: '.out',
  trailingSlash: true,
  compress: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
