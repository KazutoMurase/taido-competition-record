import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/global.css";
import { createTheme, ThemeProvider } from "@mui/material";

const MyApp: NextPage<AppProps> = ({ Component, pageProps }) => {
  const theme = createTheme({
    components: {
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '4px',
            textAlign: 'center',
            fontFamily: "Noto Sans",
          },
        },
      },
    },
  });
  return (
    <div className="app">
      <Head>
        <title>躰道大会管理システム</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap"
          rel="stylesheet"
        />
      </Head>
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </div>
  );
};

export default MyApp;
