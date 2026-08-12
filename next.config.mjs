/** @type {import('next').NextConfig} */
const nextConfig = {
  // node:sqlite module support
  serverExternalPackages: ['node:sqlite'],

  // Include the pre-seeded SQLite database in the serverless bundle
  outputFileTracingIncludes: {
    '/*': ['./spendsense.db'],
  },
};

export default nextConfig;