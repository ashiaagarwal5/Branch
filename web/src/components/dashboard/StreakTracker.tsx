'use client';

import { User } from '@branch/shared';

interface StreakTrackerProps {
  user: User;
}

export default function StreakTracker({ user }: StreakTrackerProps) {
  const streak = user.streak || 0;
  const longestStreak = user.longestStreak || 0;

  return (
    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-md p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">🔥</span>
        <div>
          <h3 className="text-lg font-semibold">Study Streak</h3>
          <p className="text-sm opacity-90">Keep the momentum going!</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <div className="text-xs opacity-75 mb-1">Current Streak</div>
          <div className="text-3xl font-bold">{streak}</div>
          <div className="text-xs opacity-75">days</div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <div className="text-xs opacity-75 mb-1">Longest Streak</div>
          <div className="text-3xl font-bold">{longestStreak}</div>
          <div className="text-xs opacity-75">days</div>
        </div>
      </div>

      {streak === 0 && (
        <div className="mt-4 text-sm opacity-90 text-center">
          Start a session today to begin your streak!
        </div>
      )}
    </div>
  );
}

