'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import type { AIInsight, WeeklySummary } from '@branch/shared';
import { Navbar } from '@/components/navbar';
import { Sun, BookOpen, Target, BarChart3 } from 'lucide-react';

export default function InsightsPage() {
  const { user } = useAuthContext();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);

  useEffect(() => {
    // Fetch AI insights and weekly summary
    // Placeholder for now
    setInsights([
      {
        id: '1',
        userId: user?.id || '',
        type: 'pattern',
        title: '🌅 Morning Productivity Peak',
        message: 'Your focus scores are highest between 8-10 AM. Consider scheduling important topics during this time.',
        isRead: false,
        isDismissed: false,
        createdAt: new Date(),
      },
      {
        id: '2',
        userId: user?.id || '',
        type: 'suggestion',
        title: '📚 Consistent Progress',
        message: 'You\'ve studied 5 days this week! Keep it up to maintain your streak.',
        isRead: false,
        isDismissed: false,
        createdAt: new Date(),
      },
      {
        id: '3',
        userId: user?.id || '',
        type: 'achievement',
        title: '🎯 Focus Champion',
        message: 'Your average focus score this week is 87% - 12% higher than last week!',
        isRead: false,
        isDismissed: false,
        createdAt: new Date(),
      },
    ]);
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">AI Insights</h1>
          <p className="text-muted-foreground mt-1">Personalized feedback powered by AI to optimize your study habits.</p>
        </div>

        {/* Weekly Summary */}
        <div className="rounded-2xl bg-card border border-border/40 p-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">This Week's Summary</h2>
              <p className="text-sm text-muted-foreground">Nov 1 - Nov 8, 2025</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl bg-accent/30 p-4">
              <div className="text-xs text-muted-foreground mb-1">Total Hours</div>
              <div className="text-3xl font-semibold text-foreground">12.5h</div>
            </div>
            <div className="rounded-xl bg-accent/30 p-4">
              <div className="text-xs text-muted-foreground mb-1">Sessions</div>
              <div className="text-3xl font-semibold text-foreground">18</div>
            </div>
            <div className="rounded-xl bg-accent/30 p-4">
              <div className="text-xs text-muted-foreground mb-1">Avg Focus</div>
              <div className="text-3xl font-semibold text-foreground">87%</div>
            </div>
            <div className="rounded-xl bg-accent/30 p-4">
              <div className="text-xs text-muted-foreground mb-1">XP Gained</div>
              <div className="text-3xl font-semibold text-foreground">1,250</div>
            </div>
          </div>

          <div className="rounded-xl bg-accent/20 p-4">
            <p className="text-sm leading-relaxed text-foreground/80">Excellent work this week! You've maintained consistent study habits and your focus has improved significantly. Your productivity peaks in the morning hours - consider tackling challenging topics during this time. Keep up the momentum to reach your weekly goal!</p>
          </div>
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>

        {/* Productivity Tips */}
        <div className="rounded-2xl bg-card border border-border/40 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Productivity Tips</h3>
          <div className="space-y-3">
            {[
              { icon: <Target className="w-4 h-4" />, title: 'Set Clear Goals', description: 'Define specific topics before each session' },
              { icon: <Sun className="w-4 h-4" />, title: 'Use Time Blocks', description: 'Study in 25-50 minute focused intervals' },
              { icon: <BookOpen className="w-4 h-4" />, title: 'Minimize Distractions', description: 'Close unnecessary tabs and notifications' },
              { icon: <BarChart3 className="w-4 h-4" />, title: 'Track Progress', description: 'Review trends weekly to adjust plan' },
            ].map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/20">
                <div className="text-primary">{tip.icon}</div>
                <div>
                  <div className="font-medium text-foreground">{tip.title}</div>
                  <div className="text-sm text-muted-foreground">{tip.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const getBackgroundColor = () => {
    switch (insight.type) {
      case 'pattern':
        return 'from-blue-500 to-cyan-500';
      case 'suggestion':
        return 'from-green-500 to-emerald-500';
      case 'achievement':
        return 'from-amber-500 to-orange-500';
      case 'warning':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border/40 p-6">
      <h3 className="text-xl font-semibold text-foreground mb-2">{insight.title}</h3>
      <p className="text-sm text-muted-foreground">{insight.message}</p>
    </div>
  );
}

