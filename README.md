# CampusGuide

CampusGuide is a full-stack web app that helps students and staff find, browse, and book campus resources — rooms, labs, equipment, and facilities — from a single dashboard. It includes user authentication, a live booking system, campus-wide search, and an AI assistant ("Genie") for natural-language queries about available spaces and equipment.

Live Link:https://campus-guide-alpha.vercel.app/

<img width="1897" height="890" alt="image" src="https://github.com/user-attachments/assets/54292a48-e27f-4b97-b354-437f4502bb40" />


## Features

- **Resource discovery** — Browse and search rooms, labs, and equipment across campus buildings, with details like capacity, floor, and attached equipment.
- **Live availability** — Check real-time availability for any resource before booking.
- **Bookings** — Create, view, and manage upcoming bookings from a personal dashboard.
- **Authentication** — Sign up and log in to manage your own bookings securely.
- **Ask Genie** — An AI-powered chat assistant that answers natural-language questions like *"find me a quiet study room"* or *"is there a 3D printer available"* and surfaces matching resources directly in the chat.
- **Campus explorer** — Browse resources grouped by building/location.
- **Light/dark mode** — Theme preference is saved across sessions.

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- Tailwind CSS
- lucide-react (icons)

**Backend**
- Node.js + Express
- File-based data store (JSON) for resources, equipment, availability, bookings, and users
- dotenv for environment configuration

## Project Structure

```
CampusGuide-main/
├── src/                       # Frontend (React)
│   ├── App.jsx
│   ├── Dashboard.jsx
│   ├── Bookings.jsx
│   ├── NewBooking.jsx
│   ├── Login.jsx
│   ├── SignUp.jsx
│   ├── ExploreCampus.jsx
│   ├── components/
│   │   └── ResourceDetail.jsx
│   └── services/
│       └── api.js
├── backend/                   # Backend (Express)
│   ├── server.js
│   ├── routes/
│   │   ├── search.js
│   │   ├── resources.js
│   │   ├── bookings.js
│   │   ├── auth.js
│   │   └── genie.js
│   ├── services/
│   │   ├── bookingService.js
│   │   ├── authService.js
│   │   ├── searchService.js
│   │   ├── liveStatus.js
│   │   └── genieService.js
│   └── data/
│       ├── bookings.json
│       └── users.json
├── public/
├── index.html
├── package.json
└── vite.config.js
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Install dependencies

From the project root:
```bash
npm install
```

Then install backend dependencies:
```bash
cd backend
npm install
```

### 2. Configure environment variables

Create a `.env` file inside `backend/` with any keys required by the Genie AI service (e.g. an API key for the underlying assistant provider). Check `backend/services/genieService.js` for the exact variable name(s) it expects.

```env
# backend/.env
GENIE_API_KEY=your_key_here
```

### 3. Run the backend

From the `backend/` folder:
```bash
node server.js
```
The API will be available at `http://localhost:3001`.

### 4. Run the frontend

From the project root (in a separate terminal):
```bash
npm run dev
```
The app will be available at the local Vite dev URL (typically `http://localhost:5173`).

## Available Scripts (frontend)

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |

## API Overview

All backend routes are mounted under `/api`:

| Route | Description |
|---|---|
| `/api/search` | Search resources, equipment, and buildings |
| `/api/resources` | List and fetch resource details/availability |
| `/api/bookings` | Create and manage bookings |
| `/api/auth` | User sign-up and login |
| `/api/genie` | AI assistant conversation endpoint |

A basic health check is available at `/health`.

## Notes

- Data is currently stored in local JSON files under `backend/data/` rather than a database — fine for development, but not intended for production use at scale.
- Ports: frontend defaults to Vite's dev port, backend runs on `3001` (configurable via `PORT` in `.env`).

## Contributing

1. Create a feature branch from `main`
2. Make your changes and commit with a clear message
3. Open a pull request describing what changed and why

## License

Add your license here (e.g. MIT).
