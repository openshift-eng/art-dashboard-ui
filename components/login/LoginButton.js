import React, { useState, useEffect } from 'react';
import Login from './Login';
import styles from 'styles/Login.module.css';

function LoginButton({ isLoginModalOpen, setIsLoginModalOpen }) {
    const modalRef = React.useRef();

    // Close the modal if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsLoginModalOpen(false);
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setIsLoginModalOpen, modalRef]);

    return (
        <div className={styles.loginButtonContainer}>
            <button className={styles.triggerButton} onClick={() => setIsLoginModalOpen(!isLoginModalOpen)}>Login</button>
            {isLoginModalOpen && (
                <div ref={modalRef} className={styles.modal}>
                    <Login />
                </div>
            )}
        </div>
    );
}

export default LoginButton;
