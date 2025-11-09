# Branch Features

Complete feature list for the MVP (Minimum Viable Product).

## ✅ Core Features (Implemented)

### 1. Authentication & User Management

**Status**: ✅ Complete

- Google OAuth sign-in via Firebase
- User profile creation and management
- Secure session handling
- Automatic user document creation on first sign-in

**Files**:
- `web/src/lib/firebase.ts`
- `web/src/hooks/useAuth.ts`
- `web/src/contexts/AuthContext.tsx`

---

### 2. Browser Extension - Automatic Tracking

**Status**: ✅ Complete

**Features**:
- Automatic session detection on study websites
- Tab tracking and domain monitoring
- Idle/active state detection (120s threshold)
- Focus score calculation based on:
  - Active time ratio
  - Tab switch frequency
  - Idle periods
- Manual session start/stop controls
- Real-time session display in popup
- Automatic session upload to backend

**Whitelisted Study Domains**:
- Learning platforms (Coursera, Udemy, Khan Academy, etc.)
- Documentation sites (MDN, Python docs, Stack Overflow)
- Coding platforms (LeetCode, HackerRank, GitHub)
- Productivity tools (Notion, Google Docs, Overleaf)
- Research sites (Google Scholar, arXiv, JSTOR)

**Files**:
- `extension/src/background/index.ts`
- `extension/src/background/sessionTracker.ts`
- `extension/src/popup/`

---

### 3. Dashboard - Overview

**Status**: ✅ Complete

**Components**:
- Welcome header with user greeting
- Current session card (active/idle status)
- XP progress bar with level display
- Streak tracker (current + longest streak)
- Stats overview cards:
  - Total study time
  - Sessions completed
  - Average focus score
  - Weekly hours
- Weekly study chart (bar graph)
- Recent sessions list

**Files**:
- `web/src/app/dashboard/page.tsx`
- `web/src/components/dashboard/`

---

### 4. Gamification System

**Status**: ✅ Complete

**XP System**:
- Base rate: 10 XP per minute
- Focus multiplier: 0.5x to 2.0x based on focus score
- Automatic XP calculation on session complete

**Levels**:
- 16 levels (0-15) with progressive XP thresholds
- Visual level progress bar
- Level-up notifications and activity feed

**Badges** (10 total):
- First Steps (1 session)
- Consistent (5-day streak)
- Dedicated (30-day streak)
- Unstoppable (100-day streak)
- Getting Started (10 hours)
- Committed Learner (100 hours)
- Master Scholar (1000 hours)
- Focus Hero (95%+ focus)
- Early Bird (study before 7 AM)
- Night Owl (study after 11 PM)

**Streaks**:
- Daily streak tracking
- Longest streak record
- Visual flame indicator
- Streak milestone activities

**Files**:
- `shared/src/constants/index.ts` (badge definitions, XP rates)
- `shared/src/utils/index.ts` (calculation logic)
- `backend/src/handlers/gamification.ts`

---

### 5. Social Features

**Status**: ✅ Complete

**Friend Feed**:
- Activity stream showing:
  - Session completions
  - Badge unlocks
  - Level ups
  - Streak milestones
- User photos and names
- Relative timestamps
- Emoji reactions (UI ready)

**Leaderboards**:
- Multiple metric types:
  - Study hours
  - Total XP
  - Current streak
- Time periods:
  - Weekly
  - Monthly
  - All-time
- Scopes:
  - Global rankings
  - Friends-only
- Top 3 podium display
- Full rankings with position changes
- Current user highlighting

**Friend Management**:
- Add/remove friends
- Friend search (UI ready)
- Friend-only leaderboards
- Activity visibility controls

**Files**:
- `web/src/app/dashboard/social/page.tsx`
- `web/src/app/dashboard/leaderboard/page.tsx`
- `web/src/components/social/`
- `backend/src/handlers/leaderboards.ts`

---

### 6. Study Sessions

**Status**: ✅ Complete

**Session Tracking**:
- Automatic via extension
- Manual start/stop option
- Session metadata:
  - Topic/title
  - Duration
  - Domains visited
  - Focus score
  - Tab switches
  - Active/idle time
  - XP earned

**Session History**:
- Full session list
- Filtering (all time, week, month)
- Session details view
- Focus score visualization
- AI summaries (when available)
- Summary statistics

**Files**:
- `web/src/app/dashboard/sessions/page.tsx`
- `backend/src/handlers/sessions.ts`

---

### 7. AI Insights & Summaries

**Status**: ✅ Complete

**AI-Generated Content**:
- Session summaries (1-2 sentences via GPT-4o-mini)
- Topic extraction from titles and domains
- Productivity pattern detection
- Personalized suggestions
- Best study time recommendations

**Weekly Summary**:
- Auto-generated every Sunday
- Includes:
  - Total hours and sessions
  - Average focus score
  - XP earned
  - New badges
  - Top topics studied
  - AI-written motivational summary
  - Improvement suggestions
  - Productivity trends

**Insights Dashboard**:
- Pattern insights (e.g., "morning productivity peak")
- Achievement highlights
- Suggestions for improvement
- Productivity tips
- Visual insight cards

**Files**:
- `web/src/app/dashboard/insights/page.tsx`
- `backend/src/handlers/ai.ts`
- `backend/src/handlers/weeklySummary.ts`

---

### 8. To-Do Management

**Status**: ✅ Complete

**Features**:
- Create study tasks
- Task properties:
  - Title and description
  - Estimated duration
  - Priority (low/medium/high)
  - Status (pending/in progress/completed)
  - XP reward
  - Due date (optional)
- Task completion tracking
- Session linking (ready for implementation)
- Checkboxes and status indicators
- Completed tasks section

**Files**:
- `web/src/app/dashboard/todos/page.tsx`

---

### 9. Backend & Database

**Status**: ✅ Complete

**Firebase Functions**:
- REST API for session creation
- Firestore triggers:
  - Auto-update user stats on session complete
  - Check and award badges
  - Create activity feed items
  - Generate AI summaries (async)
- Scheduled functions:
  - Daily leaderboard updates
  - Weekly summary generation
- Callable functions:
  - Add/remove friends

**Database Collections**:
- users
- sessions
- userStats
- badges
- userBadges
- activities
- leaderboards
- todos
- insights
- weeklySummaries

**Security**:
- Firestore rules for data access control
- User authentication required
- Friend-based visibility

**Files**:
- `backend/src/index.ts`
- `backend/src/handlers/`
- `backend/firestore.rules`

---

### 10. Productivity Algorithm

**Status**: ✅ Complete

**Metrics**:
1. **Focus Score** (30% weight)
   - Active time ratio
   - Tab switch penalty
   
2. **Consistency Score** (25% weight)
   - Sessions per week
   - Streak length
   
3. **Depth Score** (25% weight)
   - Topic diversity
   - Domain novelty
   
4. **Engagement Score** (20% weight)
   - Time-on-task
   - Session frequency

**Output**: Productivity score (0-100)

**Files**:
- `shared/src/utils/index.ts`

---

## 🎨 UI/UX Features

### Design System

- **Colors**: Navy (primary), Amber (accent), Teal (success)
- **Fonts**: Inter (body), Rubik (display)
- **Components**: Consistent rounded cards, gradient backgrounds
- **Animations**: Fade-in, slide-up, smooth transitions
- **Icons**: Emoji-based for quick recognition
- **Responsive**: Mobile-first design

### Key UI Elements

- Gradient text for brand (Branch)
- Animated progress bars
- Streak flame visualization
- Badge showcase grids
- Chart visualizations (Recharts)
- Toast notifications
- Loading skeletons
- Empty states with helpful messages

---

## 📊 Data Visualization

**Implemented**:
- Weekly study hours (bar chart)
- XP progress bar
- Focus score meters
- Streak counters
- Stat cards with icons
- Leaderboard rankings
- Badge grids

**Library**: Recharts

---

## 🔒 Privacy & Security

**Data Collection**:
- ✅ Minimal metadata only (domain, title, duration)
- ✅ No keystrokes or page content
- ✅ No sensitive data (passwords, banking)
- ✅ Encrypted data transmission
- ✅ User consent required

**User Controls**:
- ✅ Public/private profile setting
- ✅ Friend visibility controls
- ✅ Data export option (planned)
- ✅ Account deletion (planned)

---

## 🚀 Performance

**Optimizations**:
- Next.js SSR for landing page
- Client-side rendering for dashboard
- Firebase real-time listeners
- Lazy loading for charts
- Image optimization
- Code splitting

---

## 📱 Responsive Design

- ✅ Mobile navigation
- ✅ Responsive grids
- ✅ Touch-friendly buttons
- ✅ Adaptive layouts
- ✅ Mobile-optimized charts

---

## 🧪 Development Features

**Developer Experience**:
- TypeScript throughout
- Shared type definitions
- Hot reload (web + extension)
- Firebase emulators
- ESLint configuration
- Prettier formatting (planned)

**Code Organization**:
- Monorepo structure
- Modular components
- Reusable hooks
- Clean separation of concerns

---

## 📋 Planned Features (Post-MVP)

### Phase 2

- [ ] Study challenges and duels
- [ ] Virtual points and betting system
- [ ] Calendar integration (Google Calendar)
- [ ] Real-time study rooms
- [ ] Voice notes and summaries
- [ ] Mobile app (React Native)

### Phase 3

- [ ] Team study groups
- [ ] Mentorship matching
- [ ] Course integration
- [ ] Study playlists (Spotify)
- [ ] Pomodoro timer
- [ ] Focus mode enhancements

### Phase 4

- [ ] Machine learning models:
  - Focus predictor (LightGBM)
  - Topic classifier (Sentence-BERT)
  - Churn prediction
  - Personalized recommendations
- [ ] Advanced analytics:
  - Heat maps
  - Correlation analysis
  - Predictive insights

---

## 📈 Success Metrics (Tracked)

- Daily/Weekly Active Users
- Average study time per user
- Average productivity score
- Session completion rate
- Badge unlock rate
- Social engagement rate
- Weekly summary open rate
- Retention (D1, D7, D30)

---

## 🎯 MVP Definition of Done

✅ All items complete:

1. ✅ Browser extension successfully tracks study sessions automatically
2. ✅ Web app dashboard displays daily + weekly stats, streaks, and XP
3. ✅ AI summary + productivity score functional
4. ✅ Friend system and leaderboard operational
5. ✅ Weekly summary generator implemented
6. ✅ Ready for deployment (Vercel + Firebase)
7. ✅ Chrome extension build ready

---

## 🎓 Educational Value

Branch helps students:
- Build consistent study habits
- Track progress objectively
- Stay motivated through gamification
- Learn from AI-powered insights
- Connect with study communities
- Optimize study schedules
- Celebrate achievements

The app transforms studying from a solitary, unmeasured activity into a social, data-driven, and rewarding experience.

