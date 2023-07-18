import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { makeApiCall } from '../api_calls/api_calls';
import styles from 'styles/Login.module.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkLoggedInStatus = async () => {
            try {
                const data = await makeApiCall('api/v1/current_user', 'GET');
                // Check if the user is already logged in
                if (data.status !== 401) {
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        checkLoggedInStatus();
    }, []);

    const handleSubmit = async event => {
        event.preventDefault();

        const data = { username, password };

        try {
            const response = await makeApiCall('api/v1/login', 'POST', data);
            if (response.detail === 'Login successful') {
                // If the 'next' query parameter exists, use it as the redirection path. Otherwise, redirect to '/'
                const nextRoute = router.query.next || '/';
                router.push(nextRoute);
            } else if (response.status === 401) {
                alert('Wrong credentials');
            } else {
                alert('Failed to login');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to login');
        }
    };

    return (
        <div className={styles.loginContainer}>
            <img
                src="/redhat-logo.png"
                alt="Red Hat Logo"
                width={150}
                height={150}
            />
            {isLoggedIn ? (
                <p>You are already logged in.</p>
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
                    <input type="submit" value="Login" />
                </form>
            )}
        </div>
    );
}
