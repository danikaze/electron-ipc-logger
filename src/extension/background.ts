/*
 * Inject the script that connects with IPC when a page loads
 * (as a page can load multiple times compared with the extension which is
 * just installed once when the app starts)
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;

  await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    files: ['content.js'],
  });
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  reply(`echo: ${msg}`);
});
