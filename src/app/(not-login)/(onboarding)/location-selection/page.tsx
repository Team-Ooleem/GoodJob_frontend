'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Spin, message, Typography, Space, Alert, Select } from 'antd';
import { EnvironmentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getSidoList, getGuList, saveUserLocationPreference } from '@/apis/location-api';
import { Sido, Gu } from '@/types/types';

const { Title, Text } = Typography;
const { Option } = Select;

export default function LocationSelectionPage() {
    const router = useRouter();
    const [sidoList, setSidoList] = useState<Sido[]>([]);
    const [guList, setGuList] = useState<Gu[]>([]);
    const [selectedSido, setSelectedSido] = useState<string | null>(null);
    const [selectedGu, setSelectedGu] = useState<string | null>(null);
    const [loadingSido, setLoadingSido] = useState(true);
    const [loadingGu, setLoadingGu] = useState(false);
    const [saving, setSaving] = useState(false);

    // 시도 목록 로드
    useEffect(() => {
        const loadSidoList = async () => {
            try {
                setLoadingSido(true);
                const response = await getSidoList();
                if (response.success) {
                    setSidoList(response.data.sido);
                }
            } catch (error) {
                message.error('시도 목록을 불러오는데 실패했습니다.');
                console.error('Error loading sido list:', error);
            } finally {
                setLoadingSido(false);
            }
        };

        loadSidoList();
    }, []);

    // 시도 선택 시 구/군 목록 로드
    useEffect(() => {
        if (selectedSido) {
            const loadGuList = async () => {
                try {
                    setLoadingGu(true);
                    const response = await getGuList(selectedSido);
                    if (response.success) {
                        setGuList(response.data.gu);
                        setSelectedGu(null); // 시도 변경 시 구/군 선택 초기화
                    }
                } catch (error) {
                    message.error('구/군 목록을 불러오는데 실패했습니다.');
                    console.error('Error loading gu list:', error);
                } finally {
                    setLoadingGu(false);
                }
            };

            loadGuList();
        } else {
            setGuList([]);
            setSelectedGu(null);
        }
    }, [selectedSido]);

    const handleSidoChange = (sidoCode: string) => {
        setSelectedSido(sidoCode);
    };

    const handleGuChange = (guCode: string) => {
        setSelectedGu(guCode);
    };

    const handleNext = async () => {
        if (!selectedSido || !selectedGu) {
            message.warning('시도와 구/군을 모두 선택해주세요.');
            return;
        }

        try {
            setSaving(true);

            // 서버에 희망 근무지 선호도 저장
            const response = await saveUserLocationPreference({
                sidoCode: selectedSido,
                guCode: selectedGu,
            });

            if (response.success) {
                const selectedSidoName = sidoList.find(
                    (sido) => sido.sido_code === selectedSido,
                )?.sido_name;
                const selectedGuName = guList.find((gu) => gu.gu_code === selectedGu)?.gu_name;

                message.success(`선택 완료: ${selectedSidoName} ${selectedGuName}`);
                // 희망 연봉 선택 페이지로 이동
                router.push('/salary-selection');
            } else {
                message.error('희망 근무지 선택 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error saving location preference:', error);
            message.error('네트워크 연결을 확인해주세요.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrevious = () => {
        // 직군/직무 선택 페이지로 이동
        router.push('/job-selection');
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

                {/* 희망 근무지 선택 섹션 */}
                <Card className='mb-8'>
                    <div className='text-center mb-6'>
                        <EnvironmentOutlined className='text-4xl text-blue-600 mb-4' />
                        <Title level={3}>희망 근무지를 선택해주세요.</Title>
                    </div>

                    <div className='max-w-2xl mx-auto space-y-6'>
                        {/* 시도 선택 */}
                        <div>
                            <Text strong className='text-lg block mb-3'>
                                시도
                            </Text>
                            {loadingSido ? (
                                <div className='text-center py-4'>
                                    <Spin size='large' />
                                </div>
                            ) : (
                                <Select
                                    placeholder='시도를 선택해주세요'
                                    value={selectedSido}
                                    onChange={handleSidoChange}
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
                                    {sidoList.map((sido) => (
                                        <Option key={sido.sido_code} value={sido.sido_code}>
                                            {sido.sido_name}
                                        </Option>
                                    ))}
                                </Select>
                            )}
                        </div>

                        {/* 구/군 선택 */}
                        <div>
                            <Text strong className='text-lg block mb-3'>
                                구/군
                            </Text>
                            {loadingGu ? (
                                <div className='text-center py-4'>
                                    <Spin size='large' />
                                </div>
                            ) : guList.length > 0 ? (
                                <Select
                                    placeholder='구/군을 선택해주세요'
                                    value={selectedGu}
                                    onChange={handleGuChange}
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
                                    {guList.map((gu) => (
                                        <Option key={gu.gu_code} value={gu.gu_code}>
                                            {gu.gu_name}
                                        </Option>
                                    ))}
                                </Select>
                            ) : selectedSido ? (
                                <div className='text-center py-4 text-gray-500'>
                                    해당 시도에 등록된 구/군이 없습니다.
                                </div>
                            ) : (
                                <div className='text-center py-4 text-gray-500'>
                                    시도를 먼저 선택해주세요.
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 정보 메시지 */}
                <Alert
                    message='정확한 희망 근무지 입력으로 더 나은 매칭 경험을 받아보세요.'
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
                        className='px-8 h-12 bg-blue-600 hover:bg-blue-700 border-blue-600'
                        onClick={handleNext}
                        disabled={!selectedSido || !selectedGu || saving}
                        loading={saving}
                    >
                        {saving ? '저장 중...' : '다음'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
