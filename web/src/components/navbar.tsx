"use client"

import { Home, BarChart3, Clock, User, LogOut, Trophy, Users, CheckSquare } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/Button"
import toast from 'react-hot-toast';

export function Navbar() {
  const pathname = usePathname()
  const { user, signInWithGoogle, signOut } = useAuthContext();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: User },
    { href: "/dashboard/sessions", label: "Sessions", icon: Clock },
    { href: "/dashboard/social", label: "Social", icon: Users },
    { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/dashboard/todos", label: "Todos", icon: CheckSquare },
    { href: "/dashboard/insights", label: "Analytics", icon: BarChart3 },
  ]

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success('Welcome to Branch!');
    } catch (error) {
      toast.error('Failed to sign in');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <nav className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c9f2c7] to-[#96be8c] flex items-center justify-center transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 text-[#243119]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3m-9-6c4.97 0 9-1.343 9-3S16.97 0 12 0 3 1.343 3 3s4.03 3 9 3zm0 0v12"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-foreground">Branch</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {user && links.map((link) => {
              const Icon = link.icon
              const isActive = pathname?.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}
            
            {user ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="ml-2"
              >
                <LogOut className="w-4 h-4 mr-2" strokeWidth={2} />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <Button 
                onClick={handleSignIn}
                size="sm"
                className="ml-2"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
