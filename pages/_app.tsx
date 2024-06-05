import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/global.css";

const MyApp: NextPage<AppProps> = ({ Component, pageProps }) => {
  return (
    <div className="app">
      <Head>
        <title>躰道大会管理システム</title>
      </Head>
      <Component {...pageProps} />
    </div>
  );
};

export default MyApp;
