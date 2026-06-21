# Hostel Complaint Portal

A full-stack MERN application for managing hostel maintenance complaints with role-based access control. Students file complaints; wardens and admins triage, assign, and resolve them through a tracked status lifecycle.

## Features

- **JWT authentication with role-based access control** — three roles (student, warden, admin), each with different permissions enforced at the route level
- **Complaint lifecycle management** — `pending → in_progress → resolved → closed`, with a full status-change history per complaint
- **Image attachments** — students can attach a photo to a complaint (Multer, local disk storage)
- **Admin/warden dashboard** — filter complaints by status/category/priority, with aggregated counts (MongoDB aggregation pipeline)
- **Complaint assignment** — admins can assign complaints to specific wardens
- **Status-change notifications** — students are notified by email when their complaint's status changes (Nodemailer; gracefully no-ops if SMTP isn't configured)

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, Context API for auth state
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Auth:** JWT + bcrypt
- **File uploads:** Multer
- **Email:** Nodemailer

## Project Structure

```
HOSTEL-COMPLAINT-PORTAL/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT verification + role-based access guard
│   │   └── upload.js        # Multer config for complaint image uploads
│   ├── models/
│   │   ├── User.js
│   │   └── Complaint.js
│   ├── routes/
│   │   ├── auth.js          # register, login, /me
│   │   ├── users.js         # admin user management
│   │   └── complaints.js    # CRUD, status lifecycle, assignment, stats
│   ├── scripts/
│   │   └── seed.js          # creates admin + warden test accounts
│   ├── utils/
│   │   └── email.js
│   ├── uploads/             # uploaded complaint images (gitignored)
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
npm run seed            # creates admin@hostel.com / admin123 and warden@hostel.com / warden123
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. Register a new account to test the student flow, or log in with the seeded admin/warden accounts to test the staff flow.

## API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as a student |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Authenticated | Current user info |
| POST | `/api/complaints` | Student | File a new complaint (multipart, optional image) |
| GET | `/api/complaints` | Authenticated | List complaints (own for students, all for staff) — supports `?status&category&priority` |
| GET | `/api/complaints/stats` | Warden/Admin | Aggregated counts by status and category |
| GET | `/api/complaints/:id` | Authenticated | Single complaint detail |
| PATCH | `/api/complaints/:id/status` | Warden/Admin | Update status (triggers email notification) |
| PATCH | `/api/complaints/:id/assign` | Admin | Assign complaint to a warden |
| DELETE | `/api/complaints/:id` | Owner (if pending) / Admin | Delete complaint |
| GET | `/api/users` | Admin | List all users |
| PATCH | `/api/users/:id/role` | Admin | Change a user's role |


