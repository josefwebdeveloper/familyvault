chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;
  const url = encodeURIComponent(tab.url);
  chrome.windows.create({
    url: `https://familyvault-eight.vercel.app/extension/fill?url=${url}`,
    type: "popup",
    width: 420,
    height: 560,
  });
});
