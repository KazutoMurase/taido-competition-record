import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import Image from "next/image";

export const getServerSideProps = async () => {
  const competitionTitle = process.env.COMPETITION_TITLE;
  const show_total = process.env.SHOW_TOTAL_IN_PUBLIC === "1";
  const topImagePath = process.env.TOP_IMAGE_PATH || "";
  return {
    props: {
      competitionTitle,
      show_total,
      topImagePath,
    },
  };
};

export default function Home({ competitionTitle, show_total, topImagePath }) {
  const router = useRouter();

  const cardList = [
    {
      label: "時程表",
      icon: <ScheduleIcon sx={{ mr: 1, color: "primary.main" }} />,
      path: "/progress_check",
      color: "primary.main",
    },
    {
      label: "競技結果一覧",
      icon: <FlagIcon sx={{ mr: 1, color: "#f44336" }} />,
      path: "/results",
      color: "#f44336",
    },
    {
      label: "サマリー",
      icon: <MilitaryTechIcon sx={{ mr: 1, color: "#ffc107" }} />,
      path: "/summary",
      color: "#ffc107",
    },
    ...(competitionTitle.includes("高校生")
      ? [
          {
            label: "高校生サマリー",
            icon: <EmojiEventsIcon sx={{ mr: 1, color: "#ffc107" }} />,
            path: "/high_school_summary",
            color: "#ffc107",
          },
        ]
      : []),
    ...(show_total
      ? [
          {
            label: "総合得点表",
            icon: <EmojiEventsIcon sx={{ mr: 1, color: "primary.main" }} />,
            path: "/total",
            color: "primary.main",
          },
        ]
      : []),
  ];
  return (
    <div>
      <br />
      <Container maxWidth="md">
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "130px" }}
        >
          <h2 className="competition-title">
            <u>{competitionTitle}</u>
          </h2>
        </Grid>
        {topImagePath !== "" ? (
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "350px" }}
          >
            <Image src={"/" + topImagePath} width={300} height={300} alt="" />
          </Grid>
        ) : (
          <></>
        )}
        {cardList.map((card, index) => (
          <Grid
            key={`grid-${index}`}
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "100px" }}
          >
            <Card
              sx={{
                width: { xs: "100%", md: "80%" },
                height: "75%",
                display: "flex",
                borderLeft: 20,
                borderColor: card.color,
                minWidth: 140,
              }}
              key={index}
              elevation={2}
            >
              <CardActionArea
                onClick={() => {
                  router.push(card.path);
                }}
                sx={{ display: "flex", alignItems: "center", p: 1 }}
              >
                {card.icon}
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6">{card.label}</Typography>
                </CardContent>
                <Box sx={{ pr: 2, display: "flex", alignItems: "center" }}>
                  <ChevronRightIcon sx={{ color: card.color }} />
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Container>
    </div>
  );
}
