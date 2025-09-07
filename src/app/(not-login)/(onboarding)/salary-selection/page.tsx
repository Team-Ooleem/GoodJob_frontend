'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Spin, message, Typography, Space, Alert, Select } from 'antd';
import { DollarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getSalaryRanges, saveUserSalaryPreference } from '@/apis/(onboarding)/salary-api';
import { SalaryRange } from '@/types/types';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SalarySelectionPage() {
    const router = useRouter();
    const [salaryRanges, setSalaryRanges] = useState<SalaryRange[]>([]);
    const [selectedSalary, setSelectedSalary] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 연봉 구간 목록 로드
    useEffect(() => {
        const loadSalaryRanges = async () => {
            try {
                setLoading(true);
                const response = await getSalaryRanges();
                if (response.success) {
                    setSalaryRanges(response.data.salary_ranges);
                }
            } catch (error) {
                message.error('연봉 구간 목록을 불러오는데 실패했습니다.');
                console.error('Error loading salary ranges:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSalaryRanges();
    }, []);

    const handleSalaryChange = (value: number) => {
        setSelectedSalary(value);
    };

    const handleNext = async () => {
        if (!selectedSalary) {
            message.warning('희망 연봉을 선택해주세요.');
            return;
        }

        try {
            setSaving(true);

            // 서버에 희망 연봉 선호도 저장
            const response = await saveUserSalaryPreference({
                salaryRangeId: selectedSalary,
            });

            if (response.success) {
                const selectedSalaryRange = salaryRanges.find(
                    (range) => range.id === selectedSalary,
                );

                message.success(`선택 완료: ${selectedSalaryRange?.display_text}`);
                // 프로필 입력 페이지로 이동
                router.push('/profile-input');
            } else {
                message.error('희망 연봉 선택 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error saving salary preference:', error);
            message.error('네트워크 연결을 확인해주세요.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrevious = () => {
        // 희망 근무지 선택 페이지로 이동
        router.push('/location-selection');
    };

    return (
        <div className='min-h-screen bg-gray-50 py-8'>
            <div className='max-w-4xl mx-auto px-4'>
                {/* Header */}
                <div className='flex justify-between items-center mb-8'>
                    <div className='text-2xl font-bold'>Logo</div>
                    <Space size='large'>
                        <Button type='text'>채용 정보</Button>
                        <Button type='text'>인맥 관리</Button>
                        <Button type='text'>이력서 코칭</Button>
                    </Space>
                </div>

                {/* 희망 연봉 선택 섹션 */}
                <Card className='mb-8'>
                    <div className='text-center mb-6'>
                        <DollarOutlined className='text-4xl text-green-600 mb-4' />
                        <Title level={3}>희망 연봉을 선택해주세요.</Title>
                    </div>

                    <div className='max-w-2xl mx-auto'>
                        {loading ? (
                            <div className='text-center py-8'>
                                <Spin size='large' />
                            </div>
                        ) : (
                            <Select
                                placeholder='희망 연봉을 선택해주세요'
                                value={selectedSalary}
                                onChange={handleSalaryChange}
                                size='large'
                                className='w-full'
                                showSearch
                                optionFilterProp='children'
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string)
                                        ?.toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                            >
                                {salaryRanges.map((range) => (
                                    <Option key={range.id} value={range.id}>
                                        {range.display_text}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </div>
                </Card>

                {/* 정보 메시지 */}
                <Alert
                    message='정확한 희망 연봉 입력으로 더 나은 매칭 경험을 받아보세요.'
                    type='info'
                    icon={<InfoCircleOutlined />}
                    className='mb-8'
                />

                {/* 네비게이션 버튼 */}
                <div className='flex justify-between'>
                    <Button
                        size='large'
                        className='px-8 h-12 bg-gray-100 text-gray-700 border-gray-300'
                        onClick={handlePrevious}
                    >
                        이전
                    </Button>
                    <Button
                        type='primary'
                        size='large'
                        className='px-8 h-12 bg-green-600 hover:bg-green-700 border-green-600'
                        onClick={handleNext}
                        disabled={!selectedSalary || saving}
                        loading={saving}
                    >
                        {saving ? '저장 중...' : '다음'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
