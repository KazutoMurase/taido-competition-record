function toggleIframe(id, messageId, videoId) {
  const iframeContainer = document.getElementById(id);
  const message = document.getElementById(messageId);
  const existingIframe = iframeContainer.querySelector("iframe");
  if (existingIframe) {
    message.innerHTML = "動画を表示";
    iframeContainer.removeChild(existingIframe);
  } else {
    const iframe = document.createElement("iframe");
    iframe.width = "665";
    iframe.height = "500";
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.title = "YouTube video player";
    iframe.frameBorder = "0";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframeContainer.appendChild(iframe);
    message.innerHTML = "動画を隠す";
  }
}
