'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Spin, message, Typography, Space, Alert } from 'antd';
import { FolderOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getJobCategories, getJobRoles } from '@/apis/job-api';
import { JobCategory, JobRole } from '@/types/types';

const { Title, Text } = Typography;

export default function JobSelectionPage() {
    const [categories, setCategories] = useState<JobCategory[]>([]);
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingRoles, setLoadingRoles] = useState(false);

    // 직군 목록 로드
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await getJobCategories();
                if (response.success) {
                    setCategories(response.data.categories);
                }
            } catch (error) {
                message.error('직군 목록을 불러오는데 실패했습니다.');
                console.error('Error loading categories:', error);
            } finally {
                setLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    // 직군 선택 시 직무 목록 로드
    useEffect(() => {
        if (selectedCategory) {
            const loadRoles = async () => {
                try {
                    setLoadingRoles(true);
                    const response = await getJobRoles(selectedCategory);
                    if (response.success) {
                        setRoles(response.data.roles);
                        setSelectedRole(null); // 직군 변경 시 직무 선택 초기화
                    }
                } catch (error) {
                    message.error('직무 목록을 불러오는데 실패했습니다.');
                    console.error('Error loading roles:', error);
                } finally {
                    setLoadingRoles(false);
                }
            };

            loadRoles();
        } else {
            setRoles([]);
            setSelectedRole(null);
        }
    }, [selectedCategory]);

    const handleCategorySelect = (categoryId: number) => {
        setSelectedCategory(categoryId);
    };

    const handleRoleSelect = (roleId: number) => {
        setSelectedRole(roleId);
    };

    const handleNext = () => {
        if (!selectedCategory || !selectedRole) {
            message.warning('직군과 직무를 모두 선택해주세요.');
            return;
        }

        const selectedCategoryName = categories.find((cat) => cat.id === selectedCategory)?.name;
        const selectedRoleName = roles.find((role) => role.id === selectedRole)?.name;

        message.success(`선택 완료: ${selectedCategoryName} - ${selectedRoleName}`);
        // TODO: 다음 단계로 이동하는 로직 구현
    };

    const handlePrevious = () => {
        // TODO: 이전 단계로 이동하는 로직 구현
        message.info('이전 단계로 이동합니다.');
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

                {/* 직군 선택 섹션 */}
                <Card className='mb-8'>
                    <div className='text-center mb-6'>
                        <FolderOutlined className='text-4xl text-amber-600 mb-4' />
                        <Title level={3}>원하는 직군을 알려주세요.</Title>
                    </div>

                    {loadingCategories ? (
                        <div className='text-center py-8'>
                            <Spin size='large' />
                        </div>
                    ) : (
                        <div className='grid grid-cols-3 gap-4'>
                            {categories.map((category) => (
                                <Button
                                    key={category.id}
                                    size='large'
                                    className={`h-12 text-sm ${
                                        selectedCategory === category.id
                                            ? 'border-green-600 text-green-600 bg-green-50'
                                            : 'border-gray-300 hover:border-green-400'
                                    }`}
                                    onClick={() => handleCategorySelect(category.id)}
                                >
                                    {category.name}
                                </Button>
                            ))}
                        </div>
                    )}
                </Card>

                {/* 직무 선택 섹션 */}
                <Card className='mb-8'>
                    <div className='text-center mb-6'>
                        <Title level={3}>원하는 직무를 알려주세요.</Title>
                    </div>

                    {loadingRoles ? (
                        <div className='text-center py-8'>
                            <Spin size='large' />
                        </div>
                    ) : roles.length > 0 ? (
                        <div className='grid grid-cols-3 gap-4'>
                            {roles.map((role) => (
                                <Button
                                    key={role.id}
                                    size='large'
                                    className={`h-12 text-sm ${
                                        selectedRole === role.id
                                            ? 'border-green-600 text-green-600 bg-green-50'
                                            : 'border-gray-300 hover:border-green-400'
                                    }`}
                                    onClick={() => handleRoleSelect(role.id)}
                                >
                                    {role.name}
                                </Button>
                            ))}
                        </div>
                    ) : selectedCategory ? (
                        <div className='text-center py-8 text-gray-500'>
                            해당 직군에 등록된 직무가 없습니다.
                        </div>
                    ) : (
                        <div className='text-center py-8 text-gray-500'>
                            직군을 먼저 선택해주세요.
                        </div>
                    )}
                </Card>

                {/* 정보 메시지 */}
                <Alert
                    message='정확한 선호정보와 경력입력으로 매칭경험을 받아보세요.'
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
                        disabled={!selectedCategory || !selectedRole}
                    >
                        다음
                    </Button>
                </div>
            </div>
        </div>
    );
}
