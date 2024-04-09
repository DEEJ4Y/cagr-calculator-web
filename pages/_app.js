import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';

import { createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'teal',
});

export default function App({ Component, pageProps }) {
  return (
    <MantineProvider theme={theme}>
      <Component {...pageProps} />
    </MantineProvider>
  );
}
