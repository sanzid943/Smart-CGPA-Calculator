# CGPA Calculator

A vanilla HTML/CSS/JS CGPA calculator you can open straight in VS Code — no build step, no npm install.

## VS Code তে চালানোর নিয়ম

1. এই `cgpa-calculator` ফোল্ডারটা VS Code দিয়ে খুলুন (`File → Open Folder...`)।
2. VS Code Extensions থেকে **"Live Server"** (by Ritwick Dey) ইনস্টল করুন — এটা না থাকলে একবারই লাগবে।
3. `index.html` ফাইলে right-click করে **"Open with Live Server"** সিলেক্ট করুন।
4. ব্রাউজারে ক্যালকুলেটর খুলে যাবে (usually `http://127.0.0.1:5500`)।

Live Server ছাড়াও `index.html` ফাইলে সরাসরি ডাবল-ক্লিক করে ব্রাউজারে ওপেন করলেও কাজ করবে — শুধু data live-reload হবে না, বাকি সব ফিচার ঠিকঠাক চলবে।

## Features

- **Student information** — name, ID, department
- **Add / remove subjects** per semester, with credit and grade inputs
- **Automatic grade point & quality point calculation** as you type
- **Semester GPA** and a live **Overall CGPA** seal that updates instantly
- **Multiple semester support** — save as many semesters as you like
- **Semester history** — edit or delete any previously saved semester
- **Target CGPA / Required GPA calculator** — tells you the average GPA needed in remaining credits to hit a goal
- **Grade scale reference table** (collapsible)
- **Reset current ledger** and **clear all data** options
- **Dark / light mode** toggle
- **Responsive layout** — works on mobile, tablet, and desktop
- **Local persistence** — everything is saved in the browser's `localStorage`, so your data survives a page refresh (nothing is sent anywhere)

## Grading scale used

| Marks  | Grade | Point |
|--------|-------|-------|
| 80–100 | A+    | 4.00  |
| 75–79  | A     | 3.75  |
| 70–74  | A-    | 3.50  |
| 65–69  | B+    | 3.25  |
| 60–64  | B     | 3.00  |
| 55–59  | B-    | 2.75  |
| 50–54  | C+    | 2.50  |
| 45–49  | C     | 2.25  |
| 40–44  | D     | 2.00  |
| 0–39   | F     | 0.00  |

এই স্কেলটা `script.js`-এর একদম উপরে `GRADE_SCALE` array-তে আছে — আপনার university-র স্কেল আলাদা হলে ওখান থেকে সহজেই বদলে নিতে পারবেন।

## File structure

```
cgpa-calculator/
├── index.html   # structure
├── style.css    # theme + layout (light & dark)
├── script.js    # all logic & localStorage persistence
└── README.md
```
