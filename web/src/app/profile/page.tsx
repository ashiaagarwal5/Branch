import { Navbar } from "@/components/navbar"
import { User, Mail, Calendar, Award } from "lucide-react"
import { Button } from "@/components/ui/Button"

const achievements = [
  { title: "7 Day Streak", description: "Studied for 7 consecutive days", earned: true },
  { title: "Early Bird", description: "Completed 10 morning sessions", earned: true },
  { title: "100 Hours", description: "Reached 100 total study hours", earned: false },
  { title: "Consistent Learner", description: "30 day study streak", earned: false },
]

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground text-lg">Your learning journey</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-card border border-border/40 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#c9f2c7] to-[#629460] flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-1">Learner</h2>
                <p className="text-muted-foreground mb-6">Growth enthusiast</p>

                <div className="w-full space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                    <span className="text-foreground">learner@branch.app</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                    <span className="text-foreground">Joined Nov 2024</span>
                  </div>
                </div>

                <Button className="w-full rounded-xl">Edit Profile</Button>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-card border border-border/40 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-primary" strokeWidth={2} />
                <h2 className="text-xl font-semibold text-foreground">Achievements</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.title}
                    className={`p-4 rounded-xl border ${
                      achievement.earned ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${achievement.earned ? "bg-primary/10" : "bg-muted/50"}`}>
                        <Award
                          className={`w-4 h-4 ${achievement.earned ? "text-primary" : "text-muted-foreground"}`}
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
