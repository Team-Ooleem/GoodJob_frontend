const fs = require('fs');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // PDF.js worker 파일 복사
        config.resolve.alias = {
            ...config.resolve.alias,
            'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/build/pdf.worker.min.js',
        };

        return config;
    },
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
