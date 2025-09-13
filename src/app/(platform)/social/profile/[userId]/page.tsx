interface UserProfilePageProps {
    params: {
        userId: string;
    };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
    const { userId } = params;

    return <div>{userId}</div>;
}
