# Hostel Management System

This project includes a static frontend for a hostel management dashboard and a lightweight Express backend API for persistence and authentication.

## Getting started

```bash
npm install
npm start
```

Then open <http://localhost:3000> in the browser.

## Backend API

The API is available under `/api` and supports:

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/reset-password`
- `GET /api/dashboard/summary`
- `GET /api/:collection`
- `POST /api/:collection`
- `PUT /api/:collection/:id`
- `DELETE /api/:collection/:id`

Supported collections:

- `students`
- `hostels`
- `rooms`
- `allocations`
- `payments`
- `complaints`
- `notices`
- `users`
- `settings`

## Notes

The frontend still works as a static demo, and the backend stores data in `data/db.json` so records persist across server restarts.
