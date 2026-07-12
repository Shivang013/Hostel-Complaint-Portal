# Hostel Complaint Portal

A full-stack MERN application for managing hostel maintenance complaints with role-based access control. Students file complaints; wardens resolve the ones assigned to them; admins triage, assign, and manage users.

## Features

- **JWT authentication with role-based access control** — three roles (student, warden, admin), each with distinct permissions enforced at the route level
- **Scoped warden visibility** — wardens can only see and act on complaints specifically assigned to them; other wardens' assigned complaints are invisible and inaccessible (enforced server-side, not just hidden in the UI)
- **Complaint lifecycle management** — `pending → in_progress → resolved → closed`, with a full status-change history per complaint, including optional resolution remarks at each step
- **Image attachments** — students can attach a photo to a complaint (Multer, local disk storage)
- **Admin/warden dashboard** — filter complaints by status/category/priority, with aggregated counts (MongoDB aggregation pipeline); warden stats are scoped to their own assigned complaints, admin stats cover everything
- **Complaint assignment** — admins assign complaints to a specific warden via a dedicated UI on the complaint detail page

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, Context API for auth state
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Auth:** JWT + bcrypt
- **File uploads:** Multer

## Role Permissions

| Capability | Student | Warden | Admin |
|---|---|---|---|
| File a complaint | ✅ | ❌ | ❌ |
| View own complaints | ✅ | — | — |
| View complaints assigned to them | — | ✅ (only their own) | — |
| View all complaints | ❌ | ❌ | ✅ |
| Update complaint status / add resolution note | ❌ | ✅ (assigned only) | ✅ (any) |
| Assign complaints to a warden | ❌ | ❌ | ✅ |
| Delete own complaint (while pending) | ✅ | — | — |
| Delete any complaint | ❌ | ❌ | ✅ |
| Manage user roles | ❌ | ❌ | ✅ |

## Project Structure

```
HOSTEL-COMPLAINT-PORTAL/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT verification + role-based access guard
│   │   └── upload.js        # Multer config for complaint image uploads
│   ├── models/
│   │   ├── User.js
│   │   └── Complaint.js     # includes resolutionNote + per-entry status history notes
│   ├── routes/
│   │   ├── auth.js          # register, login, /me
│   │   ├── users.js         # admin user management, warden list (admin-only)
│   │   └── complaints.js    # CRUD, status lifecycle, assignment, stats — role-scoped
│   ├── scripts/
│   │   └── seed.js          # creates admin + two warden test accounts
│   ├── uploads/              # uploaded complaint images (gitignored)
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/axios.js     # axios instance with JWT interceptor
│   │   ├── components/
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   └── ComplaintDetail.jsx   # includes admin assign dropdown + resolution note field
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run seed            # creates:
                         #   admin@hostel.com  / admin123
                         #   wardenA@hostel.com / warden123
                         #   wardenB@hostel.com / warden123
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. Register a new account to test the student flow, or log in with the seeded admin/warden accounts to test the staff flow.

### Demo: proving warden isolation
1. Register a student, file a complaint.
2. Log in as admin, assign the complaint to **Warden A**.
3. Log in as **Warden B** — dashboard is empty, and directly visiting `/complaints/:id` for that complaint returns a 403.
4. Log in as **Warden A** — complaint appears, can add a resolution note and update its status.

## API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as a student |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Authenticated | Current user info |
| POST | `/api/complaints` | Student | File a new complaint (multipart, optional image) |
| GET | `/api/complaints` | Authenticated | List complaints — own (student), assigned only (warden), all (admin) — supports `?status&category&priority` |
| GET | `/api/complaints/stats` | Warden/Admin | Aggregated counts by status and category — scoped to assigned complaints for wardens |
| GET | `/api/complaints/:id` | Authenticated | Single complaint detail — 403 if a student/warden isn't the owner/assignee |
| PATCH | `/api/complaints/:id/status` | Warden (assigned only) / Admin (any) | Update status, optionally with a resolution note |
| PATCH | `/api/complaints/:id/assign` | Admin | Assign complaint to a warden (validates target user has role `warden`) |
| DELETE | `/api/complaints/:id` | Owner (if pending) / Admin | Delete complaint |
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/wardens` | Admin | List warden accounts (for the assign dropdown) |
| PATCH | `/api/users/:id/role` | Admin | Change a user's role |

## Resume Bullet Points (suggested)

- Built a full-stack MERN application implementing **role-based access control** across three user types, enforced via custom Express middleware — including per-resource ownership checks (a warden's JWT alone isn't sufficient; the API validates they're the specific assignee before returning data)
- Designed a **status-lifecycle state machine** for complaint tracking with a full audit trail of status changes and resolution remarks
- Implemented **MongoDB aggregation pipelines** to power a role-scoped admin/warden dashboard with filterable, categorized complaint statistics
- Integrated file uploads (Multer) with type/size validation for complaint image attachments
