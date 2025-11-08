'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserStats {
  averageProductivityScore: number;
}

export function ProductivityScore() {
  const { user } = useAuthContext();
  const [productivityScore, setProductivityScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProductivityScore = async () => {
      try {
        const statsDoc = await getDoc(doc(db, 'userStats', user.id));
        if (statsDoc.exists()) {
          const stats = statsDoc.data() as UserStats;
          setProductivityScore(Math.round(stats.averageProductivityScore || 0));
        }
      } catch (error) {
        console.error('Error fetching productivity score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductivityScore();
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-orange-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Productivity Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#6fb168]/20 hover:border-[#6fb168]/40 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#6fb168]" />
          Productivity Score
        </CardTitle>
        <CardDescription>Your average productivity across all sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Score Display */}
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${getScoreColor(productivityScore)}`}>
              {productivityScore}
            </span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{getScoreLabel(productivityScore)}</span>
              <span className="text-muted-foreground">{productivityScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(productivityScore)}`}
                style={{ width: `${productivityScore}%` }}
              ></div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
            <p>Productivity Score combines:</p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-[#6fb168] mt-1">•</span>
                <span>Focus quality (30%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6fb168] mt-1">•</span>
                <span>Session consistency (25%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6fb168] mt-1">•</span>
                <span>Deep work depth (25%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6fb168] mt-1">•</span>
                <span>Engagement level (20%)</span>
              </li>
            </ul>
          </div>

          {/* Tips */}
          {productivityScore < 70 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-1">💡 Tips to improve:</p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4">
                <li>• Minimize tab switching during sessions</li>
                <li>• Study consistently every day</li>
                <li>• Increase focus time in each session</li>
              </ul>
            </div>
          )}

          {productivityScore >= 80 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Outstanding performance!
              </p>
              <p className="text-xs text-green-700 mt-1">
                You're in the top tier of productive learners. Keep it up!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
