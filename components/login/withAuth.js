import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { makeApiCall } from '../api_calls/api_calls';

export default function withAuth(Component) {
    return function WithAuthComponent(props) {
        const router = useRouter();

        useEffect(() => {
            const checkAuth = async () => {
                try {
                    const data = await makeApiCall('api/v1/current_user', 'GET');

                    // Check for 401 Unauthorized status
                    if (data.status === 401) {
                        router.push(`/login?next=${router.pathname}`);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    router.push(`/login?next=${router.pathname}`);
                }
            };

            checkAuth();
        }, []);

        return <Component {...props} />;
    };
}
