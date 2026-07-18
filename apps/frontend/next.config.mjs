import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for the Docker runtime stage.
  output: 'standalone',
  // Trace workspace deps from the monorepo root so standalone is complete.
  experimental: {
    outputFileTracingRoot: path.join(currentDir, '../../'),
  },
};

export default nextConfig;
