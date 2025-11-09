"use client"

import { useEffect, useState } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function FocusTimer() {
  const STORAGE_KEY = "branch_focus_timer_v1"

  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(25 * 60) // remaining seconds
  const [duration, setDuration] = useState(25 * 60) // total seconds for current session
  const [endAt, setEndAt] = useState<number | null>(null) // epoch ms when timer ends

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      if (!raw) return
      const saved = JSON.parse(raw) as { isRunning: boolean; endAt: number | null; time: number; duration: number }
      const now = Date.now()
      if (saved.isRunning && saved.endAt) {
        const remaining = Math.max(0, Math.ceil((saved.endAt - now) / 1000))
        setIsRunning(remaining > 0)
        setTime(remaining > 0 ? remaining : 0)
        setEndAt(remaining > 0 ? saved.endAt : null)
        setDuration(saved.duration || 25 * 60)
      } else {
        setIsRunning(false)
        setTime(saved.time ?? 25 * 60)
        setDuration(saved.duration || 25 * 60)
        setEndAt(null)
      }
    } catch {
      // ignore corrupted storage
    }
  }, [])

  const persist = (next: { isRunning?: boolean; endAt?: number | null; time?: number; duration?: number }) => {
    const payload = {
      isRunning: next.isRunning ?? isRunning,
      endAt: next.endAt ?? endAt,
      time: next.time ?? time,
      duration: next.duration ?? duration,
    }
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      }
    } catch {
      // ignore
    }
  }

  // Tick every second while running
  useEffect(() => {
    if (!isRunning || !endAt) return
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setTime(remaining)
      if (remaining <= 0) {
        setIsRunning(false)
        setEndAt(null)
        persist({ isRunning: false, endAt: null, time: 0 })
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, endAt])

  // Auto-stop when timer hits zero
  useEffect(() => {
    if (time === 0 && isRunning) {
      setIsRunning(false)
      setEndAt(null)
      persist({ isRunning: false, endAt: null, time: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time])

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div className="rounded-2xl bg-card border border-border/40 p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Focus Timer</h2>

      <div className="relative">
        {/* Circular Progress Background */}
        <div className="relative w-full aspect-square max-w-[240px] mx-auto">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - time / Math.max(1, duration))}`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c9f2c7" />
                <stop offset="100%" stopColor="#629460" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-semibold text-foreground tabular-nums tracking-tight">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{isRunning ? "Focus mode active" : "Ready to focus"}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-xl bg-transparent"
          onClick={() => {
            setDuration(25 * 60)
            setTime(25 * 60)
            setIsRunning(false)
            setEndAt(null)
            persist({ isRunning: false, endAt: null, time: 25 * 60, duration: 25 * 60 })
          }}
        >
          <RotateCcw className="w-5 h-5" strokeWidth={2} />
        </Button>
        <Button
          size="lg"
          className="w-16 h-16 rounded-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-105"
          onClick={() => {
            if (isRunning) {
              // Pause
              const remaining = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : time
              setTime(remaining)
              setIsRunning(false)
              setEndAt(null)
              persist({ isRunning: false, endAt: null, time: remaining })
            } else {
              // Start
              const newEnd = Date.now() + time * 1000
              setEndAt(newEnd)
              setIsRunning(true)
              persist({ isRunning: true, endAt: newEnd })
            }
          }}
        >
          {isRunning ? (
            <Pause className="w-6 h-6" strokeWidth={2} fill="currentColor" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" strokeWidth={2} fill="currentColor" />
          )}
        </Button>
        <div className="w-12" /> {/* Spacer for symmetry */}
      </div>

      {/* Quick Timers */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={() => {
            setDuration(15 * 60)
            setTime(15 * 60)
            if (isRunning) {
              const newEnd = Date.now() + 15 * 60 * 1000
              setEndAt(newEnd)
              persist({ endAt: newEnd, duration: 15 * 60, time: 15 * 60 })
            } else {
              persist({ duration: 15 * 60, time: 15 * 60 })
            }
          }}
          className="flex-1 py-2 text-sm font-medium rounded-xl bg-muted/50 hover:bg-muted transition-colors text-foreground"
        >
          15m
        </button>
        <button
          onClick={() => {
            setDuration(25 * 60)
            setTime(25 * 60)
            if (isRunning) {
              const newEnd = Date.now() + 25 * 60 * 1000
              setEndAt(newEnd)
              persist({ endAt: newEnd, duration: 25 * 60, time: 25 * 60 })
            } else {
              persist({ duration: 25 * 60, time: 25 * 60 })
            }
          }}
          className="flex-1 py-2 text-sm font-medium rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
        >
          25m
        </button>
        <button
          onClick={() => {
            setDuration(45 * 60)
            setTime(45 * 60)
            if (isRunning) {
              const newEnd = Date.now() + 45 * 60 * 1000
              setEndAt(newEnd)
              persist({ endAt: newEnd, duration: 45 * 60, time: 45 * 60 })
            } else {
              persist({ duration: 45 * 60, time: 45 * 60 })
            }
          }}
          className="flex-1 py-2 text-sm font-medium rounded-xl bg-muted/50 hover:bg-muted transition-colors text-foreground"
        >
          45m
        </button>
      </div>
    </div>
  )
}
