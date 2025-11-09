// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const topicEl = document.getElementById('topic');
  const durationEl = document.getElementById('duration');
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
  const manualTopicInput = document.getElementById('manualTopic') as HTMLInputElement;

  const authStatusEl = document.getElementById('authStatus')!;
  const setupCodeInput = document.getElementById('setupCodeInput') as HTMLInputElement;
  const linkBtn = document.getElementById('linkBtn') as HTMLButtonElement;
  const unlinkBtn = document.getElementById('unlinkBtn') as HTMLButtonElement;
  const linkForm = document.getElementById('linkForm')!;
  const linkedInfo = document.getElementById('linkedInfo')!;
  const linkedUser = document.getElementById('linkedUser')!;

  let updateInterval: number | null = null;
  let isLinked = false;

  async function refreshAuthStatus() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
    const auth = response?.auth;

    if (auth && auth.userId) {
      isLinked = true;
      authStatusEl.textContent = 'Linked';
      authStatusEl.className = 'status-active';
      linkForm.style.display = 'none';
      linkedInfo.style.display = 'flex';
      linkedUser.textContent = auth.user?.displayName || 'Linked account';
      startBtn.disabled = false;
      stopBtn.disabled = false;
      manualTopicInput.disabled = false;
    } else {
      isLinked = false;
      authStatusEl.textContent = 'Not linked';
      authStatusEl.className = 'status-inactive';
      linkForm.style.display = 'flex';
      linkedInfo.style.display = 'none';
      startBtn.disabled = true;
      stopBtn.disabled = true;
      manualTopicInput.disabled = true;
      statusEl!.textContent = 'Link extension to begin tracking';
      statusEl!.className = 'status-inactive';
      topicEl!.textContent = '-';
      durationEl!.textContent = '0:00';
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
    }
  }

  async function updateStatus() {
    if (!isLinked) return;
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' });

    if (response.active) {
      statusEl!.textContent = response.isActive ? 'Active' : 'Idle';
      statusEl!.className = response.isActive ? 'status-active' : 'status-idle';
      topicEl!.textContent = response.topic;
      durationEl!.textContent = formatDuration(response.duration);

      startBtn!.style.display = 'none';
      stopBtn!.style.display = 'block';
      manualTopicInput!.disabled = true;
    } else {
      statusEl!.textContent = 'No active session';
      statusEl!.className = 'status-inactive';
      topicEl!.textContent = '-';
      durationEl!.textContent = '0:00';

      startBtn!.style.display = 'block';
      stopBtn!.style.display = 'none';
      manualTopicInput!.disabled = false;
    }
  }

  linkBtn?.addEventListener('click', async () => {
    const code = setupCodeInput.value.trim();
    if (!code) {
      alert('Enter a setup code from Branch web onboarding.');
      return;
    }

    linkBtn.disabled = true;
    linkBtn.textContent = 'Linking...';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LINK_EXTENSION',
        code,
        deviceName: 'Chrome Browser',
      });
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to link extension');
      }
      setupCodeInput.value = '';
      await refreshAuthStatus();
      await updateStatus();
      if (isLinked && !updateInterval) {
        updateInterval = window.setInterval(updateStatus, 1000);
      }
    } catch (error: any) {
      alert(error?.message || 'Failed to link extension');
    } finally {
      linkBtn.disabled = false;
      linkBtn.textContent = 'Link Extension';
    }
  });

  unlinkBtn?.addEventListener('click', async () => {
    unlinkBtn.disabled = true;
    try {
      await chrome.runtime.sendMessage({ type: 'LOGOUT_EXTENSION' });
      await refreshAuthStatus();
    } catch (error) {
      console.error('Failed to unlink extension', error);
    } finally {
      unlinkBtn.disabled = false;
    }
  });

  startBtn?.addEventListener('click', async () => {
    const topic = manualTopicInput!.value.trim() || 'Study Session';
    await chrome.runtime.sendMessage({
      type: 'START_MANUAL_SESSION',
      topic,
    });
    manualTopicInput!.value = '';
    updateStatus();
  });

  stopBtn?.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'STOP_SESSION' });
    updateStatus();
  });

  document.getElementById('dashboardBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  });

  await refreshAuthStatus();
  if (isLinked) {
    await updateStatus();
    updateInterval = window.setInterval(updateStatus, 1000);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (!isLinked) return;
    if (message.type === 'SESSION_STARTED' || message.type === 'SESSION_ENDED') {
      updateStatus();
    }
  });
});

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
