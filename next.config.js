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
    rewrites: async () => {
        const isDevelopment = process.env.NODE_ENV === 'development';

        if (isDevelopment) {
            // 개발 환경: 로컬 백엔드로 프록시
            return [
                {
                    source: '/api/:path*',
                    destination: 'http://localhost:4000/api/:path*',
                },
            ];
        } else {
            // 프로덕션 환경: 외부 API로 프록시
            return [
                {
                    source: '/api/:path*',
                    destination: 'https://api-good-job.duckdns.org/api/:path*',
                },
            ];
        }
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
