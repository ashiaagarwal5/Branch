import numpy as np
import pandas as pd

np.random.seed(42)

n_rows = 1000
n_users = 120
users = [f"user_{i:03d}" for i in range(n_users)]
weights_map = {"midterm":5, "project":4, "homework":2, "tiny":1}
activity_classes = ["reading","note_taking","problem_solving","coding","research","task_management","video_lecture","forum","mixed"]

rows = []
for _ in range(n_rows):
    user = np.random.choice(users)
    dominant_activity = np.random.choice(activity_classes)
    base = {"reading":1200,"note_taking":1500,"problem_solving":3000,"coding":3200,
            "research":1800,"task_management":900,"video_lecture":1600,"forum":600,"mixed":1400}
    productive_seconds = int(max(0, np.random.normal(base[dominant_activity], base[dominant_activity]*0.3)))
    duration_seconds = productive_seconds + np.random.randint(300, 1800)
    focus_index = productive_seconds / duration_seconds

    lam = 2.0 if dominant_activity=="task_management" else (1.5 if dominant_activity in ("problem_solving","coding") else 0.6)
    num_tasks = np.random.poisson(lam)
    task_score = float(sum(np.random.choice(list(weights_map.values()), size=num_tasks))) if num_tasks>0 else 0.0

    raw = 0.4*(productive_seconds/3600) + 0.3*(task_score/10) + 0.2*(focus_index) + 0.1*np.random.rand()
    raw_max = 0.4*3 + 0.3*3 + 0.2*1 + 0.1*1
    y = float(np.clip((raw / raw_max)*100 + np.random.normal(0,5), 0, 100))
    rows.append((productive_seconds, task_score, focus_index, y))

df = pd.DataFrame(rows, columns=["productive_seconds","task_score","focus_index","self_report_productivity"])
df.to_csv("productivity_P_T_F_y_1000.csv", index=False)
print("✅ File saved as productivity_P_T_F_y_1000.csv in your working directory.")
df.head()

