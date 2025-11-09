'use client';

import { useEffect, useState } from 'react';
import { BADGES } from '@branch/shared';

interface BadgeShowcaseProps {
  userId: string;
}

export default function BadgeShowcase({ userId }: BadgeShowcaseProps) {
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  useEffect(() => {
    // Fetch user's badges from Firestore
    // Placeholder for now
    setEarnedBadges(['first-session', 'streak-5', 'hours-10']);
  }, [userId]);

  const userBadges = BADGES.filter((badge) => earnedBadges.includes(badge.id));
  const lockedBadges = BADGES.filter((badge) => !earnedBadges.includes(badge.id)).slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Badges</h3>
      
      {/* Earned Badges */}
      {userBadges.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Earned</h4>
          <div className="grid grid-cols-3 gap-3">
            {userBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-3 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl"
                title={badge.description}
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <div className="text-xs font-medium text-gray-900 text-center">
                  {badge.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Next Goals</h4>
          <div className="space-y-2">
            {lockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl opacity-30">{badge.icon}</div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900">{badge.name}</div>
                  <div className="text-xs text-gray-600">{badge.requirement}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userBadges.length === 0 && (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-sm text-gray-600">
            Complete sessions to earn badges!
          </p>
        </div>
      )}
    </div>
  );
}

