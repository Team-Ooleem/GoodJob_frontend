/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'good-job-s3.s3.ap-northeast-2.amazonaws.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

module.exports = nextConfig;
