import Head from "next/head";
import Link from "next/link";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { GetLiveStreams } from "../../lib/live_streams";

export const getServerSideProps = async () => {
  const streams = GetLiveStreams();
  if (streams.length === 0) {
    return { notFound: true };
  }
  return { props: { streams } };
};

export default function LiveStreams({ streams }) {
  return (
    <>
      <Head>
        <title>ライブ配信</title>
      </Head>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" align="center" sx={{ mb: 4 }}>
          ライブ配信
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {streams.map((stream) => (
            <Grid item xs={12} sm={6} key={stream.court}>
              <Card elevation={2}>
                <CardActionArea component={Link} href={`/live/${stream.court}`}>
                  <CardContent>
                    <Typography variant="h5" align="center">
                      {stream.court.toUpperCase()}コートの配信を見る
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
