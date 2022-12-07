import type { AppProps } from 'next/app'
import { CacheProvider, EmotionCache } from '@emotion/react';
import { ThemeProvider, CssBaseline, createTheme, useMediaQuery } from '@mui/material';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import createEmotionCache from '../utility/createEmotionCache';
import lightThemeOptions from '../styles/theme/lightThemeOptions';
import darkThemeOptions from '../styles/theme/darkThemeOptions';

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const clientSideEmotionCache = createEmotionCache();

export default function App({ Component, emotionCache = clientSideEmotionCache, pageProps }: MyAppProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createTheme(prefersDarkMode? darkThemeOptions : lightThemeOptions);
  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  );
}
