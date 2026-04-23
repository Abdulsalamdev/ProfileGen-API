# Backend Wizards Stage 2 — Intelligence Query Engine

## Overview

This project is a **demographic intelligence API** built for Insighta Labs.
It allows clients (marketing teams, analysts, product teams) to:

* Store demographic profiles
* Filter data with advanced query parameters
* Sort and paginate results efficiently
* Perform **natural language searches** (rule-based)

The system is built using:

* Node.js (Express)
* MongoDB (Mongoose)
* REST API architecture

---

## Base URL

```
https://your-api-url.com
```

---

# Data Model

Each profile follows this structure:

```
{
  id: UUID v7,
  name: String (unique),
  gender: String,
  gender_probability: Number,
  age: Number,
  age_group: String,
  country_id: String,
  country_name: String,
  country_probability: Number,
  created_at: ISO 8601 timestamp
}
```

---

# Core Features

## 1. Advanced Filtering, Sorting & Pagination

### Endpoint

```
GET /api/profiles
```

### Supported Filters

| Parameter               | Description                    |
| ----------------------- | ------------------------------ |
| gender                  | male / female                  |
| age_group               | child, teenager, adult, senior |
| country_id              | ISO country code (e.g., NG)    |
| min_age                 | Minimum age                    |
| max_age                 | Maximum age                    |
| min_gender_probability  | Minimum gender confidence      |
| min_country_probability | Minimum country confidence     |

---

### Sorting

| Parameter | Values                              |
| --------- | ----------------------------------- |
| sort_by   | age, created_at, gender_probability |
| order     | asc, desc                           |

Default: `created_at desc`

---

### Pagination

| Parameter | Default | Max |
| --------- | ------- | --- |
| page      | 1       | -   |
| limit     | 10      | 50  |

---

### Example

```
/api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10
```

---

### Response

```
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": [ ... ]
}
```

---

# 2. Natural Language Query Engine (Core Feature)

### Endpoint

```
GET /api/profiles/search?q=<query>
```

---

## Parsing Approach (Rule-Based)

The system uses a **deterministic keyword-matching parser** (no AI/LLMs).

### Step-by-step logic:

1. Convert query to lowercase
2. Extract keywords using:

   * String matching (`includes`)
   * Regular expressions (for numbers)
3. Map keywords to MongoDB filters
4. Combine all filters into a single query object

---

## Supported Keywords & Mappings

### Gender

| Keyword         | Filter            |
| --------------- | ----------------- |
| male            | gender = "male"   |
| female          | gender = "female" |
| male and female | no gender filter  |

---

### Age Groups

| Keyword  | Filter                 |
| -------- | ---------------------- |
| child    | age_group = "child"    |
| teenager | age_group = "teenager" |
| adult    | age_group = "adult"    |
| senior   | age_group = "senior"   |

---

### Special Keyword

| Keyword | Meaning           |
| ------- | ----------------- |
| young   | age between 16–24 |

---

### Age Conditions

| Phrase   | Filter    |
| -------- | --------- |
| above 30 | age >= 30 |
| below 20 | age <= 20 |

---

### Country Mapping

| Keyword             | country_id |
| ------------------- | ---------- |
| nigeria             | NG         |
| kenya               | KE         |
| angola              | AO         |
| ghana               | GH         |
| uganda              | UG         |
| tanzania            | TZ         |
| usa / united states | US         |
| uk / united kingdom | GB         |

---

## 🧪 Example Queries

```
young males from nigeria
→ gender=male + age 16–24 + country=NG
```

```
females above 30
→ gender=female + age >= 30
```

```
adult males from kenya
→ gender=male + age_group=adult + country=KE
```

```
male and female teenagers above 17
→ age_group=teenager + age >= 17
```

---

## Invalid Queries

If a query cannot be interpreted:

```
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

---

# Limitations

The natural language parser is **rule-based**, so it has some limitations:

* Does not understand complex grammar or sentence structure
* Limited to predefined keywords and mappings
* Cannot handle typos (e.g., "nigerai")
* Cannot process multiple countries in one query
* Does not support advanced logical conditions (OR, NOT)
* Country mapping is limited to a predefined list

---

# Data Seeding

The database is seeded with **2026 profiles** from a JSON file.

### Features:

* Idempotent (no duplicates)
* Uses `name` as unique identifier
* Generates UUID v7 for each record

### Run:

```
node seed.js
```

---

# Error Handling

All errors follow:

```
{ "status": "error", "message": "<message>" }
```

### Status Codes

| Code | Meaning              |
| ---- | -------------------- |
| 400  | Missing parameter    |
| 422  | Invalid parameter    |
| 404  | Not found            |
| 500  | Server error         |
| 502  | External API failure |

---

# Performance Optimizations

* Indexed fields:

  * gender
  * age
  * age_group
  * country_id
  * probabilities
* Pagination prevents large payloads
* `.lean()` used for faster queries
* Query filtering avoids full table scans

---

# Additional Features

* CORS enabled (`Access-Control-Allow-Origin: *`)
* UUID v7 for all IDs
* ISO 8601 timestamps (UTC)

---

# Summary

This API provides:

* High-performance filtering and querying
* Clean RESTful design
* Deterministic natural language parsing
* Scalable architecture for real-world use

---

#  Author

Backend Wizards Stage 2 Submission
