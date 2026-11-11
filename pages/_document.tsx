import { Html, Head, Main, NextScript } from "next/document";

const initializeTheme = `(() => {
    let theme;
    try { theme = localStorage.getItem('art-dashboard-theme'); } catch {}
    const dark = theme === 'dark' || (theme !== 'light' && !matchMedia('(prefers-color-scheme: light)').matches);
    document.documentElement.classList.toggle('dark', dark);
})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: initializeTheme }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
