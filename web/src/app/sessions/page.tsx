import { Navbar } from "@/components/navbar"
import { Clock, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/Button"

const allSessions = [
  { id: 1, subject: "Mathematics", date: "Today", time: "2:30 PM", duration: "45 min", status: "completed" },
  { id: 2, subject: "Programming", date: "Yesterday", time: "10:00 AM", duration: "1h 20min", status: "completed" },
  { id: 3, subject: "Literature", date: "Yesterday", time: "4:15 PM", duration: "30 min", status: "completed" },
  { id: 4, subject: "Spanish", date: "Nov 5", time: "3:00 PM", duration: "55 min", status: "completed" },
  { id: 5, subject: "Physics", date: "Nov 5", time: "11:30 AM", duration: "1h 15min", status: "completed" },
  { id: 6, subject: "History", date: "Nov 4", time: "1:00 PM", duration: "40 min", status: "completed" },
]

export default function SessionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">Study Sessions</h1>
          <p className="text-muted-foreground text-lg">Review your learning history</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <Button className="rounded-xl">
            <Calendar className="w-4 h-4 mr-2" strokeWidth={2} />
            New Session
          </Button>
          <Button variant="outline" className="rounded-xl bg-transparent">
            <Filter className="w-4 h-4 mr-2" strokeWidth={2} />
            Filter
          </Button>
        </div>

        {/* Sessions List */}
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="divide-y divide-border/40">
            {allSessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{session.subject}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" strokeWidth={2} />
                        {session.date}
                      </span>
                      <span>{session.time}</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" strokeWidth={2} />
                        {session.duration}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
