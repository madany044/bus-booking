# 🚌 BusSearch — Bus Booking System

A full-stack bus booking platform where users can search routes, select seats, book tickets, and track their bookings — all in one place.

---

## ✨ Features

- 🔍 **Search buses** by departure city, arrival city, and date
- 🪑 **Interactive seat map** with real-time availability
- ⏱ **2-minute seat reservation timer** to hold your seats while booking
- 👤 **Authentication** — register and log in to track all your bookings
- 📋 **My Bookings** — view your full booking history when logged in
- 🔎 **Guest lookup** — find any booking using a booking ID
- 🎛 **Filters** — filter by seat type, AC/Non-AC, and departure time slot
- 📱 **Responsive design** — works on desktop and mobile
- ✅ **Error handling** — invalid inputs, full buses, expired reservations

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Neon) |
| Auth | JWT via httpOnly cookies |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## 🚀 Live Demo

| | Link |
|---|---|
| 🌐 App | [bus-booking-platform-seven.vercel.app](https://bus-booking-platform-seven.vercel.app) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/buses` | Search buses with filters |
| GET | `/api/buses/:id` | Get bus details + seat layout |
| POST | `/api/reservations` | Reserve seats for 2 minutes |
| POST | `/api/bookings` | Confirm a booking |
| GET | `/api/bookings/:id` | Get booking by ID |
| GET | `/api/bookings/my` | Get all bookings for logged-in user |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get current user |

---

## 🏃 Running Locally

**Prerequisites:** Node.js 18+, PostgreSQL database (Neon)

```bash
# Clone the repo
git clone https://github.com/your-username/bus-booking.git
cd bus-booking
```

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, FRONTEND_URL
npm run seed           # creates tables + seeds sample bus data
npm run dev            # runs on http://localhost:5000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev            # runs on http://localhost:5173
```

---

## 🗂 Sample Routes in Seed Data

| Route | Buses Available |
|-------|----------------|
| Bangalore → Chennai | 7 buses |
| Chennai → Bangalore | 1 bus |

Seat types: Normal · Semi-Sleeper · Sleeper · AC & Non-AC options

---

## 📬 Contact

<div align="center">

Designed & Developed with ❤️ by

### Madan Y

*Full Stack Developer*

[![Email](https://img.shields.io/badge/Gmail-your--email%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:madanmadany2004@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-madany044-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/madany044)

</div>

---

<div align="center">
  <sub>Built as part of a appweave-labs Full Stack Developer Intern Assignment · 2026</sub>
</div>
