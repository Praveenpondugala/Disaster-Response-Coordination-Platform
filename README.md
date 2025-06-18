# Disaster Response Coordination Platform

A backend-heavy MERN stack application built to support disaster management through real-time aggregation of social media, official updates, and geospatial resource mapping. This platform is capable of extracting disaster locations using Google Gemini API, geocoding them, and using Supabase geospatial queries to provide actionable data to responders and administrators.

---

## 🚀 Project Objective

To create a real-time coordination tool for disaster response using AI, mapping services, and geospatial queries. The platform facilitates:

- Intelligent disaster data processing and storage.
- Real-time social media monitoring and mapping.
- Resource and report tracking.
- Official updates and image verification.

---

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: Supabase (PostgreSQL)
- **APIs & Services**:
  - Google Gemini API (location extraction, image verification)
  - Mapbox / OpenStreetMap (geocoding)
  - Mock Twitter API / Bluesky (social reports)
  - Cheerio (for Browse Page scraping)
- **Dev Tools**: Cursor, Windsurf, Concurrently, Nodemon, ESLint

---

## Features

### ✅ Disaster Management (CRUD)
- `POST /disasters` — Create a disaster record.
- `GET /disasters?tag=flood` — Query disasters by tag.
- `PUT /disasters/:id` — Update a disaster.
- `DELETE /disasters/:id` — Delete a disaster.

### 🧠 Location Extraction & Geocoding
- Uses Google Gemini API to extract location names from free-text descriptions.
- Converts location names to coordinates via Google Maps, Mapbox, or OSM.
- Endpoint: `POST /geocode`

### 📢 Real-Time Social Media Monitoring
- Fetch social posts from mock API or Bluesky.
- Real-time updates using `Socket.IO`.
- Endpoint: `GET /disasters/:id/social-media`

### 📍 Geospatial Resource Mapping
- Uses Supabase’s geospatial capabilities (ST_DWithin).
- Supports queries like: `GET /disasters/:id/resources?lat=..&lon=..`

### 📰 Official Updates Aggregation
- Scrapes content from sites like FEMA and Red Cross using Cheerio.
- Endpoint: `GET /disasters/:id/official-updates`

### 🖼️ Image Verification (Gemini API)
- Verifies image authenticity and context.
- Endpoint: `POST /disasters/:id/verify-image`

### 🔁 Real-Time System
- Emits WebSocket events:
  - `disaster_updated`
  - `social_media_updated`
  - `resources_updated`

### 👤 Authentication (Mock)
- Hardcoded users: `netrunnerX`, `reliefAdmin`
- Roles: `admin`, `contributor`

### 💾 Supabase Caching
- Caches Gemini, geocoding, social, and browse page data.
- TTL: 1 hour.
- Table: `cache`

---

## 🧭 Database Schema (Supabase)

### `disasters`
| Field         | Type         |
|---------------|--------------|
| id            | UUID         |
| title         | TEXT         |
| location_name | TEXT         |
| location      | GEOGRAPHY    |
| description   | TEXT         |
| tags          | TEXT[]       |
| owner_id      | TEXT         |
| audit_trail   | JSONB        |
| created_at    | TIMESTAMP    |

### `reports`
| Field              | Type     |
|--------------------|----------|
| id                 | UUID     |
| disaster_id        | UUID     |
| user_id            | TEXT     |
| content            | TEXT     |
| image_url          | TEXT     |
| verification_status| TEXT     |
| created_at         | TIMESTAMP|

### `resources`
| Field         | Type      |
|---------------|-----------|
| id            | UUID      |
| disaster_id   | UUID      |
| name          | TEXT      |
| location_name | TEXT      |
| location      | GEOGRAPHY |
| type          | TEXT      |
| created_at    | TIMESTAMP |

### `cache`
| Field       | Type    |
|-------------|---------|
| key         | TEXT    |
| value       | JSONB   |
| expires_at  | TIMESTAMP |

Indexes:
- `GIN` on tags
- `GIST` on geospatial columns
- Index on `owner_id`

---

## ⚙️ API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /disasters | Create a disaster |
| GET    | /disasters?tag=flood | Get disasters by tag |
| PUT    | /disasters/:id | Update disaster |
| DELETE | /disasters/:id | Delete disaster |
| GET    | /disasters/:id/social-media | Fetch social posts |
| GET    | /disasters/:id/resources | Get resources nearby |
| GET    | /disasters/:id/official-updates | Scrape official updates |
| POST   | /disasters/:id/verify-image | Verify image authenticity |
| POST   | /geocode | Extract and geocode location |

---

## 🛠️ Setup Instructions

### 1. Clone & Install
```bash
git clone <repo>
cd disaster-response-platform
npm install
```
### 2. Setup Supabase
- Create project at Supabase
- Add tables as per schema
- Add Supabase keys to .env

### 3. Environment Variables
Create a .env file:
```bash
SUPABASE_URL=
SUPABASE_KEY=
GOOGLE_API_KEY=
GEMINI_API_KEY=
```

#### 4. Run Project
```
npm run dev
```
