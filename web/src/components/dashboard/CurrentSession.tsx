'use client';

import { useState, useEffect } from 'react';
import { formatDuration } from '@branch/shared';

export default function CurrentSession() {
  const [sessionActive, setSessionActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [topic, setTopic] = useState('');

  useEffect(() => {
    // Check extension for active session
    // This would integrate with the Chrome extension via messaging
    const checkSession = () => {
      // Placeholder: would query extension
      // For now, simulate no active session
      setSessionActive(false);
    };

    checkSession();
    const interval = setInterval(checkSession, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!sessionActive) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⏸️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Session</h3>
          <p className="text-gray-600 mb-6">
            Install the browser extension or start a manual session to begin tracking.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
              Install Extension
            </button>
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Start Manual Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg p-8 text-white">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium opacity-90">Active Session</span>
          </div>
          <h2 className="text-3xl font-bold">{formatDuration(duration)}</h2>
        </div>
        <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
          Stop Session
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
        <div className="text-sm opacity-75 mb-1">Current Topic</div>
        <div className="text-lg font-semibold">{topic || 'Study Session'}</div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs opacity-75 mb-1">Focus</div>
          <div className="text-2xl font-bold">85%</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs opacity-75 mb-1">XP Earned</div>
          <div className="text-2xl font-bold">120</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs opacity-75 mb-1">Tab Switches</div>
          <div className="text-2xl font-bold">5</div>
        </div>
      </div>
    </div>
  );
}

