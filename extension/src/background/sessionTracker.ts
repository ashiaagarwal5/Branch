import {
  STUDY_DOMAINS,
  DISTRACTION_DOMAINS,
  MIN_SESSION_DURATION_SECONDS,
  extractDomain,
  isStudyDomain,
  calculateFocusScore,
  calculateXP
} from '@branch/shared';
import { getAccessToken } from './auth';

const API_BASE =
  process.env.BRANCH_API_BASE_URL ||
  'http://localhost:5001/dann-91ae4/us-central1/api';

interface SessionData {
  startTime: number;
  domains: Set<string>;
  tabSwitches: number;
  activeTime: number;
  idleTime: number;
  lastActivityTime: number;
  topic: string;
  isActive: boolean;
  source: 'extension' | 'manual';
}

export class SessionTracker {
  private currentSession: SessionData | null = null;
  private lastDomain: string = '';

  constructor() {
    this.loadSession();
  }

  private async loadSession() {
    const stored = await chrome.storage.local.get('currentSession');
    if (stored.currentSession) {
      this.currentSession = {
        ...stored.currentSession,
        domains: new Set(stored.currentSession.domains),
      };
    }
  }

  private async saveSession() {
    if (this.currentSession) {
      await chrome.storage.local.set({
        currentSession: {
          ...this.currentSession,
          domains: Array.from(this.currentSession.domains),
        },
      });
    }
  }

  handleTabChange(url: string, title: string) {
    const domain = extractDomain(url);
    if (!domain) return;

    // Check if it's a distraction domain
    if (isStudyDomain(domain, DISTRACTION_DOMAINS)) {
      this.stopSession();
      return;
    }

    // Check if it's a study domain
    if (isStudyDomain(domain, STUDY_DOMAINS)) {
      if (!this.currentSession) {
        this.startSession(domain, title);
      } else {
        this.updateSession(domain);
      }
    }
  }

  private startSession(domain: string, title: string) {
    const now = Date.now();
    this.currentSession = {
      startTime: now,
      domains: new Set([domain]),
      tabSwitches: 0,
      activeTime: 0,
      idleTime: 0,
      lastActivityTime: now,
      topic: title,
      isActive: true,
      source: 'extension',
    };
    this.lastDomain = domain;
    this.saveSession();
    this.notifySessionStart();
  }

  startManualSession(topic: string) {
    const now = Date.now();
    this.currentSession = {
      startTime: now,
      domains: new Set(),
      tabSwitches: 0,
      activeTime: 0,
      idleTime: 0,
      lastActivityTime: now,
      topic: topic,
      isActive: true,
      source: 'manual',
    };
    this.saveSession();
    this.notifySessionStart();
  }

  private updateSession(domain: string) {
    if (!this.currentSession) return;

    if (domain !== this.lastDomain) {
      this.currentSession.tabSwitches++;
      this.lastDomain = domain;
    }

    this.currentSession.domains.add(domain);
    this.saveSession();
  }

  updateCurrentSession() {
    if (!this.currentSession || !this.currentSession.isActive) return;

    const now = Date.now();
    const timeSinceLastActivity = (now - this.currentSession.lastActivityTime) / 1000;

    // Add to active time (capped at tracking interval)
    this.currentSession.activeTime += Math.min(timeSinceLastActivity, 30);
    this.currentSession.lastActivityTime = now;

    this.saveSession();
  }

  handleIdle() {
    if (!this.currentSession) return;

    this.currentSession.isActive = false;
    const now = Date.now();
    const timeSinceLastActivity = (now - this.currentSession.lastActivityTime) / 1000;
    this.currentSession.idleTime += timeSinceLastActivity;

    this.saveSession();
  }

  handleActive() {
    if (!this.currentSession) return;

    this.currentSession.isActive = true;
    this.currentSession.lastActivityTime = Date.now();
    this.saveSession();
  }

  async stopSession() {
    if (!this.currentSession) return;

    const now = Date.now();
    const duration = (now - this.currentSession.startTime) / 1000;

    // Only save sessions longer than minimum duration
    if (duration >= MIN_SESSION_DURATION_SECONDS) {
      await this.saveSessionToBackend();
    }

    this.currentSession = null;
    await chrome.storage.local.remove('currentSession');
    this.notifySessionEnd();
  }

  private async saveSessionToBackend() {
    if (!this.currentSession) return;

    const now = Date.now();
    const duration = (now - this.currentSession.startTime) / 1000;
    const totalTime =
      this.currentSession.activeTime + this.currentSession.idleTime;

    const focusScore = calculateFocusScore(
      this.currentSession.activeTime,
      Math.max(totalTime, duration),
      this.currentSession.tabSwitches
    );

    const durationMinutes = duration / 60;
    const xpEarned = calculateXP(durationMinutes, focusScore);

    const authState = await getAccessToken();
    if (!authState) {
      console.error('Extension not linked to a Branch account');
      return;
    }

    const sessionData = {
      userId: authState.userId,
      startTime: new Date(this.currentSession.startTime).toISOString(),
      endTime: new Date(now).toISOString(),
      duration: Math.round(duration),
      topic: this.currentSession.topic,
      domains: Array.from(this.currentSession.domains),
      focusScore,
      tabSwitches: this.currentSession.tabSwitches,
      activeTime: Math.round(this.currentSession.activeTime),
      idleTime: Math.round(this.currentSession.idleTime),
      xpEarned,
      source: this.currentSession.source,
      platform: 'chrome-extension',
    };

    try {
      const response = await fetch(`${API_BASE}/logs/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.accessToken}`,
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      console.log('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
      await this.storeForRetry(sessionData);
    }
  }

  private async storeForRetry(sessionData: any) {
    const { pendingSessions = [] } = await chrome.storage.local.get('pendingSessions');
    pendingSessions.push(sessionData);
    await chrome.storage.local.set({ pendingSessions });
  }

  private notifySessionStart() {
    chrome.runtime.sendMessage({ type: 'SESSION_STARTED' });
  }

  private notifySessionEnd() {
    chrome.runtime.sendMessage({ type: 'SESSION_ENDED' });
  }

  getSessionStatus() {
    if (!this.currentSession) {
      return { active: false };
    }

    const now = Date.now();
    const duration = (now - this.currentSession.startTime) / 1000;

    return {
      active: true,
      topic: this.currentSession.topic,
      duration: Math.round(duration),
      domains: Array.from(this.currentSession.domains),
      tabSwitches: this.currentSession.tabSwitches,
      isActive: this.currentSession.isActive,
    };
  }
}

