/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    '172.25.32.1',
    '172.25.32.1:3000',
    '172.17.176.1',
    '172.17.176.1:3000',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000'
  ],
};

export default nextConfig;
