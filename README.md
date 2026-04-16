# NameInsight API 🚀

A RESTful backend service that analyzes a given name using multiple external APIs, classifies the data, and stores it in a database.

---

## 📌 Overview

This API accepts a name, retrieves data from three external services (gender, age, nationality), processes the information, and stores a structured profile. It also provides endpoints to manage and query stored profiles.

---

## 🛠️ Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* Axios
* UUID v7

---

## 🌍 External APIs

* Genderize → predicts gender
* Agify → estimates age
* Nationalize → predicts nationality

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone <your-repo-link>
cd backend-stage1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
```

Update your database config to use:

```js
mongoose.connect(process.env.MONGO_URI)
```

---

### 4. Run the Server

```bash
npm run dev
```

Server will run at:

```
http://localhost:3000
```

---

## 📡 API Endpoints

### 🔹 Create Profile

**POST** `/api/profiles`

Request:

```json
{
  "name": "ella"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

---

### 🔹 Get Single Profile

**GET** `/api/profiles/:id`

---

### 🔹 Get All Profiles

**GET** `/api/profiles`

Query Parameters (optional):

* `gender`
* `country_id`
* `age_group`

Example:

```
/api/profiles?gender=male&country_id=NG
```

---

### 🔹 Delete Profile

**DELETE** `/api/profiles/:id`

Response:

```
204 No Content
```

---

## 🧠 Business Logic

### Age Classification

* 0–12 → child
* 13–19 → teenager
* 20–59 → adult
* 60+ → senior

### Nationality Selection

* Chooses the country with the highest probability

---

## 🔁 Idempotency

If a profile with the same name already exists:

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { ... }
}
```

---

## ⚠️ Error Handling

Standard format:

```json
{
  "status": "error",
  "message": "Error message"
}
```

### Status Codes

* `400` → Missing or invalid name
* `404` → Profile not found
* `502` → External API failure
* `500` → Internal server error

---

## 🌐 CORS

Enabled for all origins:

```
Access-Control-Allow-Origin: *
```

---

## 🧪 Testing

Use Postman or curl:

```bash
POST /api/profiles
Content-Type: application/json
```

---

## 📈 Future Improvements

* Pagination
* Rate limiting
* Caching external API responses
* Deployment (Render / Railway)

---

## 👨‍💻 Author

Silent Architect

---
