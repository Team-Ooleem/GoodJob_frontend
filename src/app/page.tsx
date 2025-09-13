import PlatformPage from './(platform)/page';
import UserLayout from './(platform)/layout';

export default function Home() {
    return (
        <UserLayout>
            <PlatformPage />
        </UserLayout>
    );
}
