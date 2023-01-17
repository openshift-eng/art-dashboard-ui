import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>ART Self Service</title>
        <meta name="description" content="ART Self Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to ART Self Service!
        </h1>

        <p className={styles.description}>
          Get started by clicking one of the following links:
        </p>

        <div className={styles.grid}>
          <Link href="/new-content" className={styles.card}>
            <h2>Request New Content&rarr;</h2>
            <p>Add a new image or RPM to be released with OCP</p>
          </Link>
          <a href="http://art-dash.engineering.redhat.com/" className={styles.card}>
            <h2>Dashboard &rarr;</h2>
            <p>Find the information about my builds.</p>
          </a>

          <a href="https://art-docs.engineering.redhat.com/" className={styles.card}>
            <h2>Docs &rarr;</h2>
            <p>See how ART drives OCP releases.</p>
          </a>

          <a
            href="https://source.redhat.com/groups/public/atomicopenshift/atomicopenshift_wiki/openshift_automated_release_tooling_art_team_faqs"
            className={styles.card}
          >
            <h2>About ART Team &rarr;</h2>
            <p>Learn more about what ART team does.</p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
