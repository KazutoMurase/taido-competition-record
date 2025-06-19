import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import "../styles/global.css";
import { createTheme, ThemeProvider } from "@mui/material";
import { useEffect, useState } from "react";

const MyApp: NextPage<AppProps> = ({ Component, pageProps }) => {
  const theme = createTheme({
    components: {
      MuiTableCell: {
        styleOverrides: {
          root: {
            "&.MuiTableCell-root": {
              padding: "4px",
              textAlign: "center",
              fontFamily: "Noto Sans",
            },
            // 条件付きスタイル
            [".admin &"]: {
              fontSize: "20px",
            },
          },
          head: {
            color: "white",
            fontWeight: "bold",
            fontSize: "18px",
          },
        },
      },
    },
  });
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith("/admin");
  const isTestPage = router.pathname.startsWith("/test");
  const [competitionTitle, setCompetitionTitle] = useState("");
  useEffect(() => {
    setCompetitionTitle(
      process.env.NEXT_PUBLIC_COMPETITION_TITLE || "躰道 大会速報",
    );
  }, []);
  return (
    <div className="app">
      <Head>
        <title>
          {isAdminPage
            ? "躰道 大会管理システム"
            : isTestPage
              ? "躰道 大会管理システムテスト"
              : competitionTitle}
        </title>
      </Head>
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </div>
  );
};

export default MyApp;
