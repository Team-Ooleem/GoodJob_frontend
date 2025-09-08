const fs = require('fs');
const path = require('path');

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
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    // HTTPS 설정
    // server: {
    //     https: {
    //         key: fs.readFileSync(path.join(__dirname, 'ssl/localhost-key.pem')),
    //         cert: fs.readFileSync(path.join(__dirname, 'ssl/localhost.pem')),
    //     },
    // },
};

module.exports = nextConfig;
