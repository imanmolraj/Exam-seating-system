# 🎓 ExamSeat — Intelligent Exam Seating Arrangement System

> Final Year Project | Curious Minds (T01) | Heritage Institute of Technology, Kolkata  
> Department of Computer Science & Engineering (Data Science)

---

## 📋 Project Overview

ExamSeat is a full-stack web application that automates exam seating arrangements and invigilator assignments using intelligent constraint-based algorithms. It eliminates manual errors, ensures departmental fairness, and generates printer-ready Excel reports.

**Team:** Harsh Raj · Pratyush Palit · Anmol Raj · Rajdeep Senapati  
**Mentor:** Prof. Deblina Chowdhury

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Recharts |
| Backend | Flask 3 + Flask-JWT-Extended |
| Database | SQLite via SQLAlchemy |
| Auth | JWT (JSON Web Tokens) |
| Output | OpenPyXL (Excel .xlsx) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ 
- Node.js 18+
- npm

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

Flask runs on → **http://localhost:5000**

On first run, a default superadmin is created:
- Username: `superadmin`
- Password: `Admin@1234`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

React runs on → **http://localhost:5173**

---

## 📊 CSV File Format

### Students CSV
| Column | Accepted Names | Example |
|--------|---------------|---------|
| Student ID | `StudentID`, `ID`, `Roll`, `RollNo` | 2262044 |
| Name | `Name`, `StudentName`, `FullName` | Harsh Raj |
| Department | `Department`, `Dept` | CSE-DS |

**Example:**
```csv
StudentID,Name,Department
2262044,Harsh Raj,CSE-DS
2262045,Pratyush Palit,CSE-AI
2262046,Anmol Raj,ECE
```

### Teachers CSV
| Column | Accepted Names | Example |
|--------|---------------|---------|
| Teacher ID | `TeacherID`, `ID`, `Tid` | T001 |
| Name | `Name`, `TeacherName`, `FullName` | Prof. A Sharma |
| Department | `Department`, `Dept` | CSE-DS |

**Example:**
```csv
TeacherID,Name,Department
T001,Prof. A Sharma,CSE-DS
T002,Prof. B Das,ECE
T003,Prof. C Roy,ME
```

---

## 🧠 Algorithm Overview

### 3-Phase Seating Strategy

**Phase 1 — Perfect Rooms (≥30 students)**  
Creates rooms using alternating `[A, B, A, B]` column pattern with optimal department pairs. Greedy selection picks the pair filling the most seats.

**Phase 2 — Good Rooms (≥20 students)**  
Same strategy with relaxed minimum threshold for smaller cohorts.

**Phase 3 — Leftover Columnar**  
Handles remaining students by filling columns sequentially from largest department.

### Invigilator Assignment
- Greedy load balancing using a counter
- Strict constraint: no examiner supervises their own department
- Falls back to cross-department pool if needed
- Assigns 2 invigilators per room

### Metrics Computed
| Metric | Description |
|--------|-------------|
| Room Utilization | % of seats actually filled |
| Fairness Index | 0–1 score of dept distribution evenness |
| Load Variance | Std deviation of invigilator duties |
| Conflict Count | Same-dept invigilator violations (target: 0) |

---

## 🔐 Auth & Roles

| Role | Permissions |
|------|-------------|
| `superadmin` | Full access: create/delete admins, all records |
| `admin` | Generate plans, view/download/delete own records |

JWT tokens expire after **8 hours**.

---

## 🗂️ Project Structure

```
exam-seating-system/
│
├── backend/
│   ├── app.py              # Flask app + all API routes
│   ├── algorithm.py        # Core seating algorithm (extracted & enhanced)
│   ├── requirements.txt
│   └── start.sh            # One-click start script
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Router + protected routes
        ├── api.js              # Axios client with JWT interceptors
        ├── index.css           # Global design system
        ├── main.jsx
        ├── context/
        │   └── AuthContext.jsx  # Global auth state
        ├── components/
        │   ├── Layout.jsx       # Sidebar + main layout
        │   └── MetricCard.jsx   # Reusable stat card
        └── pages/
            ├── Login.jsx        # Animated login
            ├── Dashboard.jsx    # Overview + charts
            ├── Allocate.jsx     # Upload → Generate → Download
            ├── Records.jsx      # Past exam management
            └── AdminManage.jsx  # Admin CRUD (superadmin)
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Get current admin |
| GET | `/api/admins` | ✅ | List all admins |
| POST | `/api/admins` | ✅ Superadmin | Create admin |
| DELETE | `/api/admins/:id` | ✅ Superadmin | Delete admin |
| POST | `/api/allocate` | ✅ | Run allocation |
| GET | `/api/allocate/:id/download` | ✅ | Download Excel |
| GET | `/api/records` | ✅ | List all records |
| GET | `/api/records/:id` | ✅ | Get single record |
| DELETE | `/api/records/:id` | ✅ | Delete record |
| GET | `/api/dashboard/stats` | ✅ | Dashboard metrics |

---

## 🚢 Deployment (Next Phase)

Planned deployment stack:
- **Backend:** Render / Railway (Flask + gunicorn)
- **Frontend:** Vercel / Netlify
- **Database:** Migrate SQLite → PostgreSQL for production

---

## 📄 License

Academic project — Heritage Institute of Technology, Kolkata. All rights reserved.
