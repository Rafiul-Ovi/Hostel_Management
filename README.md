# Hostel Management System

This project includes a static frontend for a hostel management dashboard and a lightweight Express backend API for persistence and authentication. A MySQL schema is included for the production database design.

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

The frontend still works as a static demo, and the current backend stores data in `data/db.json` so records persist across server restarts.

## MySQL database

The normalized MySQL schema is in `database/schema.sql`. Import it with the MySQL client:

```bash
mysql -u root -p < database/schema.sql
```

This creates the `hostel_management` database and tables for hostels, rooms, students, allocations, payments, complaints, notices, users, and settings. It also inserts the default settings and the two admin/manager demo accounts.

The Express API has not been switched to MySQL yet; it continues to use `data/db.json`. The schema can be imported independently while the MySQL connection credentials and migration strategy are configured.
