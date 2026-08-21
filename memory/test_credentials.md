# Test Credentials — Mentoring

## Admin Back-office
- URL: `/admin/login`
- Email: `admin@mentoring.com`
- Password: `Mentoring2025!`
- Role: admin

## Auth endpoints
- POST `/api/auth/login`
- GET `/api/auth/me` (Bearer token)
- GET `/api/admin/inscriptions` (protected)
- PATCH `/api/admin/inscriptions/{id}` (protected)
- GET/PUT `/api/admin/payment-links` (protected)
- GET `/api/admin/stats` (protected)
