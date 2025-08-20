module.exports = {
  siteUrl: 'https://motia.dev',
  generateRobotsTxt: true, // Auto-generate robots.txt
  generateIndexSitemap: false,
  exclude: [
    '/api/*', // Exclude API routes
    '/*.mdx', // Exclude direct .mdx access
    '/docs/real-', // Exclude problematic incomplete URLs
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: [
          '/_next/static/',
          '/_next/',
          '/static/',
          '/api/',
          '/*.mdx$',
          '/favicon.ico?*',
          '*.css?*',
          '*.js?*',
        ],
        allow: [
          '/docs/',
          '/manifesto',
          '/privacy-policy',
          '/telemetry',
          '/toc',
        ],
      },
    ],
    additionalSitemaps: [
      'https://motia.dev/sitemap.xml',
    ],
  },
}
