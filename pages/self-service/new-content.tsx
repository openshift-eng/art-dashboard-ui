import * as React from 'react';
import Head from "next/head"
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { NewContentStateProvider } from '../../components/self-service/new-content-state';
import { NewContentWizard } from '../../components/self-service/new-content-wizard';


export default function NewContent() {
  return (
    <NewContentStateProvider>
      <Head>
        <title>Add ART definition for OCP component</title>
      </Head>
      <Container maxWidth="xl">
        <Typography component="h1" variant="h5" sx={{ mt: 6 }}>
          Request a new image or rpm to be managed by ART and released with OCP
        </Typography>
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
