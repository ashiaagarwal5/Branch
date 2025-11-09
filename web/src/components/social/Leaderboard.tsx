'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '@branch/shared';

interface LeaderboardProps {
  type: 'hours' | 'xp' | 'streak';
  period: 'weekly' | 'monthly' | 'all-time';
  scope: 'global' | 'friends';
  userId: string;
}

export default function Leaderboard({ type, period, scope, userId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    // Fetch leaderboard from Firestore
    // Placeholder for now
    setTimeout(() => {
      const mockEntries = Array.from({ length: 20 }, (_, i) => ({
        userId: `user${i + 1}`,
        userName: `User ${i + 1}`,
        userPhoto: `https://i.pravatar.cc/150?img=${i + 1}`,
        rank: i + 1,
        score: type === 'hours' ? 50 - i * 2 : type === 'xp' ? 5000 - i * 200 : 30 - i,
        change: Math.floor(Math.random() * 5) - 2,
      }));
      
      setEntries(mockEntries);
      setUserRank(15);
      setLoading(false);
    }, 500);
  }, [type, period, scope, userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatScore = (score: number) => {
    if (type === 'hours') return `${score.toFixed(1)}h`;
    if (type === 'xp') return `${score} XP`;
    return `${score} days`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-amber-600 to-amber-800';
    return 'from-gray-200 to-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-end justify-center gap-4">
          {entries.slice(0, 3).map((entry, idx) => {
            const positions = [1, 0, 2]; // 2nd, 1st, 3rd
            const position = positions[idx];
            const heights = ['h-32', 'h-40', 'h-24'];
            const actualRank = position + 1;

            return (
              <div key={entry.userId} className="flex flex-col items-center">
                <img
                  src={entry.userPhoto || `https://i.pravatar.cc/150?img=${actualRank}`}
                  alt={entry.userName}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg mb-2"
                />
                <div className="text-center mb-2">
                  <div className="font-bold text-gray-900">{entries[position].userName}</div>
                  <div className="text-sm text-gray-600">{formatScore(entries[position].score)}</div>
                </div>
                <div
                  className={`w-24 ${heights[idx]} bg-gradient-to-br ${getRankColor(
                    actualRank
                  )} rounded-t-xl flex items-center justify-center`}
                >
                  <span className="text-3xl font-bold text-white">{actualRank}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-white rounded-2xl shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Full Rankings</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {entries.slice(3).map((entry, idx) => {
            const isCurrentUser = entry.rank === userRank;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  isCurrentUser ? 'bg-primary-50' : ''
                }`}
              >
                <div className="w-8 text-center font-bold text-gray-900">#{entry.rank}</div>
                
                <img
                  src={entry.userPhoto || `https://i.pravatar.cc/150?img=${idx + 4}`}
                  alt={entry.userName}
                  className="w-10 h-10 rounded-full"
                />
                
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{entry.userName}</div>
                  {isCurrentUser && (
                    <div className="text-xs text-primary-600 font-medium">You</div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {entry.change !== 0 && (
                    <div
                      className={`text-sm font-medium ${
                        entry.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}
                    </div>
                  )}
                  <div className="font-bold text-gray-900 min-w-[80px] text-right">
                    {formatScore(entry.score)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

