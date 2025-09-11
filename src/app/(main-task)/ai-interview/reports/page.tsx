'use client';

import { useEffect, useState } from 'react';
import { Card, List, Typography, Tag, Space, Button, Pagination, Empty, Spin, message } from 'antd';
import { TrophyOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '@/apis/api';
import { useRouter } from 'next/navigation';

type ReportListItem = {
    session_id: string;
    overall_score: number;
    question_count: number;
    created_at: string;
};

const { Title, Text } = Typography;

export default function ReportsPage() {
    const [items, setItems] = useState<ReportListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState<number | undefined>(undefined);
    const router = useRouter();

    const fetchList = async (p = page, ps = pageSize) => {
        setLoading(true);
        try {
            const offset = (p - 1) * ps;
            const res = await api.get('/report', { params: { limit: ps, offset } });
            if (res.data?.success) {
                const rows = (res.data.data || []) as ReportListItem[];
                setItems(rows);
                // 총 개수는 API에 없으므로 다음 페이지 유무로 추정하거나 undefined 유지
                setTotal(rows.length < ps ? offset + rows.length : undefined);
            }
        } catch (e) {
            message.error('리포트 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(page, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    const scoreTag = (score: number) => {
        const color = score >= 90 ? 'green' : score >= 80 ? 'blue' : score >= 70 ? 'orange' : 'red';
        return <Tag color={color}>{score}점</Tag>;
    };

    const onOpenReport = (sessionId: string) => {
        try { localStorage.setItem('aiInterviewSessionId', sessionId); } catch {}
        router.push('/ai-interview/result');
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
            <div className='container mx-auto px-4'>
                <div className='text-center mb-6'>
                    <Title level={2} className='!text-3xl !font-bold !text-gray-800'>
                        <TrophyOutlined className='mr-2 text-yellow-500' /> AI 면접 리포트 목록
                    </Title>
                    <Text type='secondary'>최근 진행한 모의면접 리포트를 확인하세요.</Text>
                </div>

                <Card className='!border-0 !shadow-lg'>
                    <div className='flex justify-between items-center mb-3'>
                        <div />
                        <Button icon={<ReloadOutlined />} onClick={() => fetchList()} disabled={loading}>
                            새로고침
                        </Button>
                    </div>

                    {loading ? (
                        <div className='py-16 text-center'>
                            <Spin size='large' />
                        </div>
                    ) : items.length === 0 ? (
                        <Empty description='리포트가 없습니다' />
                    ) : (
                        <>
                            <List
                                dataSource={items}
                                renderItem={(it) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key='open'
                                                type='primary'
                                                icon={<FileSearchOutlined />}
                                                onClick={() => onOpenReport(it.session_id)}
                                            >
                                                결과 보기
                                            </Button>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <Space size='large'>
                                                    <Text strong>세션ID: {it.session_id}</Text>
                                                    {scoreTag(it.overall_score)}
                                                </Space>
                                            }
                                            description={
                                                <Space size='large'>
                                                    <Text type='secondary'>문항 수: {it.question_count}</Text>
                                                    <Text type='secondary'>생성일: {new Date(it.created_at).toLocaleString()}</Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                            <div className='mt-4 flex justify-center'>
                                <Pagination
                                    current={page}
                                    pageSize={pageSize}
                                    total={total}
                                    showSizeChanger
                                    onChange={(p, ps) => {
                                        setPage(p);
                                        setPageSize(ps);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
