# HireReady
# ResumeIQ — AI-Powered Resume Analyzer

> Upload your resume. Get an instant ATS score, skill gap report, keyword match analysis, and personalized improvement suggestions — powered by machine learning.

---

## 📸 Pages

| Page | Description |
|------|-------------|
| **Landing** | Hero, features, how-it-works, CTA |
| **Login / Register** | Split-panel auth with password strength meter |
| **Dashboard** | Scores, skill gaps, suggestions, resume history |
| **Upload & Analysis** | 3-step flow: upload → analyze → results |
| **Job Match** | Paste a JD and get a keyword match score |
| **Skill Analysis** | Detected skills vs. recommended additions |
| **My Resumes** | Table of all analyzed resumes |
| **Legal** | Privacy Policy, Terms of Service, Contact — single scroll page |

---

## ✨ Features

- **ATS Score** — measures how well a resume performs against Applicant Tracking Systems
- **Keyword Match** — compares resume keywords against a target job description
- **Job Fit Score** — overall alignment with the pasted job posting
- **Content Strength** — quality and completeness of resume sections
- **Skill Gap Analysis** — present vs. missing skills with role-specific context
- **Resume Profile Clustering** — K-Means based role category detection (Technical / Data / Management)
- **Actionable Suggestions** — prioritized High / Medium / Low improvement tips
- **Job Description Matcher** — paste any JD and get found/missing keywords as chips
- **Resume History** — stores and displays up to 10 past analyses per session
- **Dynamic user session** — name, initials, and greeting pulled from `localStorage`; no hardcoded placeholder names

---

## 🗂️ Project Structure

```
resume-analyzer/
│
├── index.html                  # Landing page
├── legal.html                  # Privacy, Terms & Contact (single-scroll)
│
├── pages/
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   └── dashboard.html          # Main app — all 5 views in one file
│
├── css/
│   └── style.css               # Complete design system (pure CSS)
│
└── js/
    ├── user.js                 # localStorage session utilities (load first)
    ├── auth.js                 # Login & register logic
    ├── dashboard.js            # All dashboard views + analysis engine
    └── main.js                 # Landing page animations
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 (semantic) |
| Styling | Pure CSS — no Bootstrap, no Tailwind |
| Scripting | Vanilla JavaScript (ES6+) |
| Fonts | DM Serif Display + DM Sans via Google Fonts |
| Storage | `localStorage` (session, resume history, analysis results) |
| Backend *(planned)* | Flask (Python) |
| Database *(planned)* | MySQL |
| ML Models *(planned)* | Random Forest (ATS scoring), K-Means (clustering), NLP (keyword extraction) |

> This repository contains the **frontend only**. Backend and ML integration are in progress.

---

## 🚀 Getting Started

No build tools or dependencies required — it's plain HTML/CSS/JS.

**1. Clone the repository**

```bash
git clone https://github.com/your-username/resume-analyzer.git
cd resume-analyzer
```

**2. Open in browser**

Just open `index.html` directly in your browser:

```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

Or serve it locally with any static server:

```bash
# Using Python
python -m http.server 3000

# Using Node.js (npx)
npx serve .
```

Then visit `http://localhost:3000`.

---

## 🔄 User Flow

```
Landing Page (index.html)
       │
       ├── Register → saves name + email to localStorage
       │
       └── Login → reads stored user OR derives name from email
               │
               └── Dashboard (pages/dashboard.html)
                       │
                       ├── 📊 Dashboard     — scores, skill gaps, suggestions
                       ├── 📄 Upload        — drag & drop → analysis → results
                       ├── 🎯 Job Match     — paste JD → keyword comparison
                       ├── 🔍 Skill Analysis — detected vs. recommended skills
                       └── 📁 My Resumes    — history of analyzed resumes
```

---

## 💾 localStorage Schema

All data is stored client-side in the browser. No backend calls are made in the current version.

| Key | Contents |
|-----|----------|
| `riq_user` | `{ firstName, lastName, email }` |
| `riq_last_analysis` | Full analysis result object (scores, skills, suggestions, cluster) |
| `riq_resumes` | Array of up to 10 resume history entries |

---

## 📐 Design System

All styles live in `css/style.css` using CSS custom properties.

```css
--ink:     #111111   /* primary text      */
--ink-2:   #444444   /* secondary text    */
--ink-3:   #888888   /* muted / labels    */
--line:    #e8e8e8   /* borders           */
--bg:      #ffffff   /* page background   */
--bg-2:    #f7f7f5   /* subtle background */
--accent:  #3d6aff   /* blue accent       */
--success: #16a34a
--warn:    #d97706
--danger:  #dc2626
--radius:  10px
```

**Fonts:** `DM Serif Display` (headings) · `DM Sans` (body)

---

## 📱 Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| `≤ 1024px` | Score grid → 2 columns; upload grid → single column |
| `≤ 900px`  | Hero image hidden; sidebar collapses to hamburger toggle; auth left panel hidden |
| `≤ 640px`  | Nav links hidden (hamburger); features → single column; name fields stack |

---

## 🔮 Planned Backend Integration

The frontend is designed to be connected to a Flask backend with the following endpoints:

```
POST /api/analyze          → Upload resume file + JD, returns analysis JSON
POST /api/auth/register    → Create user account
POST /api/auth/login       → Authenticate and return session token
GET  /api/resumes          → Fetch user's resume history
GET  /api/resumes/:id      → Fetch single analysis result
```

ML pipeline (planned):
- **Text extraction** — PyMuPDF / python-docx
- **ATS scoring** — Random Forest Regressor trained on ~9,500 resume dataset
- **Keyword matching** — TF-IDF + cosine similarity
- **Role clustering** — K-Means (n=3 initial clusters)
- **Skill detection** — Named Entity Recognition (spaCy)

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 🙋‍♀️ Author

Built by **Aizza Singh**

---

*ResumeIQ — helping job seekers understand and improve their resumes with AI.*