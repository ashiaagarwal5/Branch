'use client';

import { User, calculateLevel, getXPForNextLevel, getLevelProgress } from '@branch/shared';

interface XPProgressProps {
  user: User;
}

export default function XPProgress({ user }: XPProgressProps) {
  const currentLevel = user.level;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const progress = getLevelProgress(user.xp);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">{currentLevel}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{user.xp} XP</span>
          <span>{nextLevelXP} XP</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          {Math.round((1 - progress) * (nextLevelXP - user.xp))} XP to Level {currentLevel + 1}
        </p>
      </div>
    </div>
  );
}

