/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    async rewrites() {
        return [
            {
                source: '/ws/:path*',
                destination: 'http://localhost:3000/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
