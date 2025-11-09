'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Trophy, Zap, Flame, Target, TrendingUp, Users, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { BranchLogo } from './BranchLogo';
import { TreeCharacter } from './TreeCharacter';

export default function LandingPage() {
  const { signInWithGoogle } = useAuthContext();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to Branch!');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async () => {
    await handleSignIn();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden relative">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#e8f5e3] via-[#d4f4d0] to-[#b8e6b0]">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <defs>
              <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a8dba0" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#8bc683" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#6fb168" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path d="M200 800 L220 600 L180 650 L200 500 L160 550 L200 400 L140 450 L200 300 L120 350 L200 200 L100 250 L200 100 L80 150 L200 0 L200 800 Z" fill="url(#treeGradient)" />
            <path d="M600 800 L620 550 L580 600 L600 400 L560 450 L600 300 L540 350 L600 200 L520 250 L600 100 L500 150 L600 0 L600 800 Z" fill="url(#treeGradient)" opacity="0.6" />
            <path d="M1000 800 L1020 600 L980 650 L1000 500 L960 550 L1000 400 L940 450 L1000 300 L920 350 L1000 200 L900 250 L1000 100 L880 150 L1000 0 L1000 800 Z" fill="url(#treeGradient)" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-gray-200 backdrop-blur-sm bg-white/60">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <BranchLogo size="text-2xl" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-700 mr-4">
              <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
              <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
            </div>
            <Button onClick={handleSignIn} disabled={isSigningIn} variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300">
              <LogIn className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Log In</span>
            </Button>
            <Button onClick={handleSignUp} disabled={isSigningIn} className="bg-[#a8dba0] hover:bg-[#8bc683] text-white border border-[#8bc683]">
              <UserPlus className="w-4 h-4 mr-2" />
              <span>Sign Up</span>
            </Button>
          </motion.div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <div className="container mx-auto px-6 py-20 md:py-32 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="flex-shrink-0">
              <TreeCharacter size={160} showMessage={true} animated={true} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex-1 text-center lg:text-left">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-[#6fb168] via-[#8bc683] to-[#a8dba0] bg-clip-text text-transparent">Track Your Productivity</span>
                <br />
                <span className="text-gray-900">Compete with Friends</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed">
                Measure your productivity score. Build streaks. Climb the leaderboard with friends.
              </motion.p>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="flex justify-center lg:justify-start">
                <Button onClick={handleSignUp} disabled={isSigningIn} size="lg" className="bg-[#6fb168] hover:bg-[#5a9a54] text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50">
                  {isSigningIn ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      <span>Get Started Free</span>
                    </>
                  )}
                </Button>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8 text-gray-600">
                <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-[#6fb168]" /><span className="text-sm">Unlock Badges</span></div>
                <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-[#6fb168]" /><span className="text-sm">Earn XP</span></div>
                <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-[#6fb168]" /><span className="text-sm">Build Streaks</span></div>
                <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#6fb168]" /><span className="text-sm">Level Up</span></div>
              </motion.div>
            </motion.div>
          </div>

          {/* Dashboard preview */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }} className="mt-20 max-w-6xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-gray-300 bg-white backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="flex-1 text-center text-xs text-gray-400">branch.app</div>
              </div>
              <div className="p-8 bg-gradient-to-br from-[#e8f5e3] to-[#d4f4d0]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-[#6fb168]" /><span className="text-sm text-gray-600">Experience</span></div>
                      <span className="text-2xl font-bold text-[#6fb168]">2,450</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-[#6fb168] to-[#a8dba0]" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500">Level 12 • 550 XP to next level</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /><span className="text-sm text-gray-600">Current Streak</span></div>
                      <span className="text-2xl font-bold text-orange-500">14 days</span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(7)].map((_, i) => (<div key={i} className="flex-1 h-8 rounded border" style={{ backgroundColor: 'rgba(111, 177, 104, 0.15)', borderColor: 'rgba(111, 177, 104, 0.3)' }}></div>))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Keep it growing! 🌱</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-600" /><span className="text-sm text-gray-600">Badges</span></div>
                      <span className="text-2xl font-bold text-yellow-600">8/24</span>
                    </div>
                    <div className="flex gap-2">
                      {[...Array(4)].map((_, i) => (<div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(168, 219, 160, 0.2)', border: '1px solid rgba(111, 177, 104, 0.3)' }}><Trophy className="w-5 h-5 text-[#6fb168]" /></div>))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Unlock more achievements</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Study Session</h3>
                    <span className="text-sm text-[#6fb168] font-semibold">+125 XP</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6fb168' }}></div><span className="text-gray-700">Mathematics - Calculus</span></div>
                      <span className="text-sm text-gray-500">45 min</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#a8dba0' }}></div><span className="text-gray-700">Computer Science - Algorithms</span></div>
                      <span className="text-sm text-gray-500">32 min</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Target className="w-4 h-4 text-[#6fb168]" /><span className="font-medium">Productivity Score: 87 • Great session! 🌳</span></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} id="features" className="mt-32 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard icon={<Zap className="w-6 h-6" />} title="Auto-Tracking" description="Browser extension automatically logs your study sessions with zero friction." color="text-[#6fb168]" />
            <FeatureCard icon={<Trophy className="w-6 h-6" />} title="Gamification" description="Earn XP, maintain streaks, unlock badges, and level up as you learn." color="text-yellow-600" />
            <FeatureCard icon={<Users className="w-6 h-6" />} title="Social Feed" description="Share progress, compete on leaderboards, and stay accountable with friends." color="text-[#8bc683]" />
            <FeatureCard icon={<Target className="w-6 h-6" />} title="AI Insights" description="Get personalized summaries, productivity scores, and performance feedback." color="text-[#a8dba0]" />
            <FeatureCard icon={<TrendingUp className="w-6 h-6" />} title="Analytics" description="Visualize your study patterns, track trends, and optimize your schedule." color="text-[#6fb168]" />
            <FeatureCard icon={<Flame className="w-6 h-6" />} title="Streaks & Goals" description="Set study goals, maintain daily streaks, and watch your knowledge tree grow." color="text-orange-500" />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 Branch. Built with 🌳 by Ashia, Dan, Theo & Suvas. Free forever.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div whileHover={{ y: -5, scale: 1.02 }} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#6fb168] transition-all duration-300 shadow-sm hover:shadow-md">
      <div className={`${color} mb-4`}>{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

