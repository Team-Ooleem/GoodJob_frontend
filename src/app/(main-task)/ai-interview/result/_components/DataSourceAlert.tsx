// result/_components/DataSourceAlert.tsx
'use client';

import { Alert } from 'antd';

interface DataSourceAlertProps {
    dataSource: 'server' | 'localStorage' | 'unavailable';
}

export default function DataSourceAlert({ dataSource }: DataSourceAlertProps) {
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const getMessage = () => {
        switch (dataSource) {
            case 'server':
                return '데이터 소스: 서버';
            case 'localStorage':
                return '데이터 소스: 로컬 캐시';
            case 'unavailable':
                return '데이터 소스: 불가능';
            default:
                return '데이터 소스: 알 수 없음';
        }
    };

    const getType = () => {
        switch (dataSource) {
            case 'server':
                return 'success';
            case 'localStorage':
                return 'warning';
            case 'unavailable':
                return 'error';
            default:
                return 'info';
        }
    };

    return <Alert message={getMessage()} type={getType()} className='mb-4' showIcon />;
}
