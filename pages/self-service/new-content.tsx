import * as React from 'react';
import Head from "next/head"
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Moon, Sun } from 'lucide-react';

import { NewContentStateProvider } from '../../components/self-service/new-content-state';
import { NewContentWizard } from '../../components/self-service/new-content-wizard';
import { useTheme } from '../../components/theme/ThemeProvider';


export default function NewContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <NewContentStateProvider>
      <Head>
        <title>Add ART definition for OCP component</title>
      </Head>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mt: 6 }}>
          <Typography component="h1" variant="h5">
            Request a new image or rpm to be managed by ART and released with OCP
          </Typography>
          <Button
            variant="outlined"
            startIcon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        </Box>
        <Box sx={{ mt: 6 }}>
          <NewContentWizard />
        </Box>
      </Container>
    </NewContentStateProvider>
  )
}

export async function getStaticProps() {
  return {
    props: {}
  }
}
