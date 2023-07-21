import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import LoginButton from '../components/login/LoginButton'; 
import Head from 'next/head'
import { notification } from 'antd';

export default function Home() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
      // If the 'loginRequired' query parameter is present, open the notification
      if (router.query.loginRequired) {
          setIsLoginModalOpen(true);
          notification.config({
              placement: 'bottomRight',
          });
          notification.open({
              message: 'Login Required',
              description: 'You need to log in to view this page.',
          });
      }
  }, [router.query]);;
  
  return (
      <div className={styles.container}>
          <Head>
              <title>ART Self Service</title>
              <link rel="icon" href="/redhat-logo.png"/>
          </Head>

          <header>
              <LoginButton isLoginModalOpen={isLoginModalOpen} setIsLoginModalOpen={setIsLoginModalOpen} />
          </header>

            <main>
                <h1 className={styles.title}>
                    Welcome to ART Self Service!
                </h1>

                <p className={styles.description}>
                    Get started by clicking one of the following links:
                </p>

                <div className={styles.grid}>
                    <a href="/self-service/new-content"
                       className={styles.card}>
                        <h3>Request New Content&rarr;</h3>
                        <p>Add a new image or RPM to be released with OCP</p>
                    </a>

                    <a href="/dashboard" className={styles.card}>
                        <h3>Dashboard &rarr;</h3>
                        <p>Find the information about releases</p>
                    </a>

                    <a
                        href="https://art-docs.engineering.redhat.com/"
                        className={styles.card}
                    >
                        <h3>Docs &rarr;</h3>
                        <p>See how ART drives OCP releases</p>
                    </a>

                    <a
                        href="https://source.redhat.com/groups/public/atomicopenshift/atomicopenshift_wiki/openshift_automated_release_tooling_art_team_faqs"
                        className={styles.card}
                    >
                        <h3>About ART Team &rarr;</h3>
                        <p>
                            Learn more about what ART team does.
                        </p>
                    </a>
                </div>
            </main>

            <footer>
            </footer>

            <style jsx>{`
              main {
                padding: 5rem 0;
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }

              footer {
                width: 100%;
                height: 100px;
                border-top: 1px solid #eaeaea;
                display: flex;
                justify-content: center;
                align-items: center;
              }

              footer img {
                margin-left: 0.5rem;
              }

              footer a {
                display: flex;
                justify-content: center;
                align-items: center;
                text-decoration: none;
                color: inherit;
              }

              code {
                background: #fafafa;
                border-radius: 5px;
                padding: 0.75rem;
                font-size: 1.1rem;
                font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
                DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
              }
            `}</style>

            <style jsx global>{`
              html,
              body {
                padding: 0;
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
                Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
                sans-serif;
              }
              
              

              * {
                box-sizing: border-box;
              }
              
            `}</style>
        </div>
    )
}