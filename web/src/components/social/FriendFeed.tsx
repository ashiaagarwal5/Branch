'use client';

import { useEffect, useState } from 'react';
import { getRelativeTime, formatDuration } from '@branch/shared';
import type { FriendActivity } from '@branch/shared';

interface FriendFeedProps {
  userId: string;
}

export default function FriendFeed({ userId }: FriendFeedProps) {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch activities from Firestore
    // Placeholder for now
    setTimeout(() => {
      setActivities([
        {
          id: '1',
          userId: 'user1',
          userName: 'Alex Chen',
          userPhoto: 'https://i.pravatar.cc/150?img=1',
          type: 'session_complete',
          topic: 'Machine Learning Fundamentals',
          duration: 2700,
          xpEarned: 450,
          timestamp: new Date(Date.now() - 3600000),
          reactions: {},
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Sarah Johnson',
          type: 'badge_earned',
          badgeName: '5-Day Streak',
          timestamp: new Date(Date.now() - 7200000),
          reactions: {},
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Mike Torres',
          userPhoto: 'https://i.pravatar.cc/150?img=3',
          type: 'level_up',
          newLevel: 5,
          timestamp: new Date(Date.now() - 10800000),
          reactions: {},
        },
      ]);
      setLoading(false);
    }, 500);
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
          <p className="text-gray-600">Add friends to see their study activities here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Friend Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: FriendActivity }) {
  const renderContent = () => {
    switch (activity.type) {
      case 'session_complete':
        return (
          <>
            <div className="text-4xl mb-2">📚</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{activity.userName}</span> completed a study session
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {activity.topic} • {formatDuration((activity.duration || 0) / 60)} • +{activity.xpEarned} XP
              </p>
              <p className="text-xs text-gray-500 mt-2">{getRelativeTime(activity.timestamp)}</p>
            </div>
          </>
        );

      case 'badge_earned':
        return (
          <>
            <div className="text-4xl mb-2">🏆</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{activity.userName}</span> earned a badge
              </p>
              <p className="text-sm text-gray-600 mt-1">{activity.badgeName}</p>
              <p className="text-xs text-gray-500 mt-2">{getRelativeTime(activity.timestamp)}</p>
            </div>
          </>
        );

      case 'level_up':
        return (
          <>
            <div className="text-4xl mb-2">⭐</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{activity.userName}</span> leveled up
              </p>
              <p className="text-sm text-gray-600 mt-1">Now Level {activity.newLevel}!</p>
              <p className="text-xs text-gray-500 mt-2">{getRelativeTime(activity.timestamp)}</p>
            </div>
          </>
        );

      case 'streak_milestone':
        return (
          <>
            <div className="text-4xl mb-2">🔥</div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-semibold">{activity.userName}</span> hit a streak milestone
              </p>
              <p className="text-sm text-gray-600 mt-1">{activity.streakDays} days!</p>
              <p className="text-xs text-gray-500 mt-2">{getRelativeTime(activity.timestamp)}</p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
      {activity.userPhoto && (
        <img
          src={activity.userPhoto}
          alt={activity.userName}
          className="w-12 h-12 rounded-full"
        />
      )}
      {renderContent()}
    </div>
  );
}

