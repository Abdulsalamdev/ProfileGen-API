# Insighta Labs API

A secure demographic intelligence system powering filtering, search, and analytics across global profile data.

---

## Base URL
https://your-api-url.com

---

## Features

- GitHub OAuth (PKCE)
- JWT Access + Refresh Tokens
- Role-Based Access Control (Admin / Analyst)
- Advanced filtering & sorting
- Natural language search engine
- CSV export support
- Rate limiting & request logging

---

## Authentication

All protected routes require:

Authorization: Bearer <access_token>

Tokens expire quickly and must be refreshed using:

POST /auth/refresh

---

## Roles

### Admin
- Full access to all endpoints

### Analyst
- Read-only access to profile data

---

## Profiles API

### GET /api/profiles

Supports:

- gender
- age_group
- country_id
- min_age / max_age
- min_gender_probability
- min_country_probability
- sort_by: age | created_at | gender_probability
- order: asc | desc
- page (default 1)
- limit (max 50)

---

## Natural Language Search

### GET /api/profiles/search?q=

Examples:

- "young males from nigeria"
- "females above 30"
- "adult males from kenya"

---

## CSV Export

GET /api/profiles/export

Returns downloadable CSV of filtered dataset.

---

## Error Format

```json
{
  "status": "error",
  "message": "Error description"
}

pkce_code_verifier