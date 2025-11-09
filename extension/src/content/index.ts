// Content script - runs in the context of web pages
// Currently minimal, but can be extended for:
// - Detecting specific study activity
// - Extracting page content for AI summaries
// - Monitoring user interaction patterns

console.log('Branch Extension: Content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    // Extract main content for AI summary
    const content = extractMainContent();
    sendResponse({ content });
  }
  return true;
});

function extractMainContent(): string {
  // Simple content extraction - can be enhanced
  const title = document.title;
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map(h => h.textContent)
    .filter(Boolean)
    .join(' | ');
  
  return `${title} - ${headings}`;
}

