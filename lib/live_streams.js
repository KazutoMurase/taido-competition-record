const SUPPORTED_COURTS = ["a", "b", "c", "d", "e", "f"];
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function GetLiveStream(court) {
  const normalizedCourt = String(court || "").toLowerCase();
  if (!SUPPORTED_COURTS.includes(normalizedCourt)) {
    return null;
  }

  const videoId =
    process.env[`YOUTUBE_VIDEO_ID_${normalizedCourt.toUpperCase()}`];
  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    return null;
  }

  return {
    court: normalizedCourt,
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

export function GetLiveStreams() {
  return SUPPORTED_COURTS.map(GetLiveStream).filter(Boolean);
}
