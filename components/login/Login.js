import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { makeApiCall } from '../api_calls/api_calls';
import styles from 'styles/Login.module.css';
import { notification, Button } from 'antd';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkLoggedInStatus = async () => {
            try {
                const data = await makeApiCall('api/v1/check_auth', 'GET');
                if (data.detail === 'Authenticated') {
                    setIsLoggedIn(true);
                } else {
                    setIsLoggedIn(false);
                }
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    setIsLoggedIn(false);
                }
            } finally {
                setIsChecking(false);
            }
        };
        
        checkLoggedInStatus();
    }, []);

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "sessionData") {
                const updatedSessionData = JSON.parse(e.newValue);
                setIsLoggedIn(updatedSessionData.isLoggedIn);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (isChecking) {
        return null;  
    }

    const handleSubmit = async event => {
        event.preventDefault();

        const data = { username, password };

        try {
            const response = await makeApiCall('api/v1/login', 'POST', data);
            if (response.detail === 'Login successful') {
                const sessionData = { isLoggedIn: true };
                localStorage.setItem('sessionData', JSON.stringify(sessionData));

                notification.config({
                    placement: 'bottomRight',
                });
                notification.success({ message: 'Logged in successfully!' });
                const nextRoute = router.query.next || '/private/privatePage';
                router.push(nextRoute);
            } else if (response.status === 401) {
                notification.error({ message: 'Wrong credentials' });
            } else {
                notification.error({ message: 'Failed to login' });
            }
        } catch (error) {
            notification.error({ message: 'Failed to login' });
        }
    };
    
    const goToPrivatePage = () => {
        router.push('/private/privatePage');
    };

    return (
        <div className={styles.loginContainer}>
            {isLoggedIn ? (
                <div>
                    <p>You are already logged in.</p>
                    <Button onClick={goToPrivatePage}>
                        Go to Private Page
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <label>
                        Username:
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
                    </label>
                    <label>
                        Password:
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    </label>
                    <input className={styles.triggerButton} type="submit" value="Login" />
                </form>
            )}
        </div>
    );
}
