import { STUDY_DOMAINS, DISTRACTION_DOMAINS, IDLE_THRESHOLD_SECONDS, TRACKING_INTERVAL_SECONDS } from '@branch/shared';
import { SessionTracker } from './sessionTracker';
import { getAccessToken, getStoredAuth, linkExtension, logoutExtension } from './auth';

console.log('Branch Extension: Background service worker initialized');

const sessionTracker = new SessionTracker();

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    sessionTracker.handleTabChange(tab.url, tab.title || '');
  }
});

// Track tab updates (URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    sessionTracker.handleTabChange(changeInfo.url, tab.title || '');
  }
});

// Track idle state changes
chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === 'idle' || newState === 'locked') {
    sessionTracker.handleIdle();
  } else if (newState === 'active') {
    sessionTracker.handleActive();
  }
});

// Set idle detection interval
chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);

// Periodic session update
setInterval(() => {
  sessionTracker.updateCurrentSession();
}, TRACKING_INTERVAL_SECONDS * 1000);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'GET_SESSION_STATUS':
        sendResponse(sessionTracker.getSessionStatus());
        break;
      case 'START_MANUAL_SESSION':
        sessionTracker.startManualSession(message.topic);
        sendResponse({ success: true });
        break;
      case 'STOP_SESSION':
        await sessionTracker.stopSession();
        sendResponse({ success: true });
        break;
      case 'LINK_EXTENSION':
        try {
          const auth = await linkExtension(message.code, message.deviceName);
          sendResponse({ success: true, auth });
        } catch (error: any) {
          sendResponse({ success: false, error: error?.message || 'Failed to link extension' });
        }
        break;
      case 'GET_AUTH_STATUS': {
        const auth = await getStoredAuth();
        sendResponse({ success: true, auth });
        break;
      }
      case 'LOGOUT_EXTENSION':
        await logoutExtension();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'unknown_message' });
    }
  })();
  return true;
});

// Check for study domains on startup
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url) {
    sessionTracker.handleTabChange(tabs[0].url, tabs[0].title || '');
  }
});

