# Smart Up Backend API

Backend server for the Smart Up study materials platform.

## Tech Stack

- **Node.js** + **Express** - Server framework
- **Supabase** - Database (PostgreSQL) + Authentication + File Storage
- **Multer** - File upload handling

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a free account
3. Create a new project
4. Get your API credentials from Project Settings > API

### 3. Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```

### 4. Run the Server

**Development mode** (auto-restart on changes):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Log in user
- `POST /api/auth/logout` - Log out user

### Materials
- `GET /api/materials` - Get all materials
- `POST /api/materials` - Upload new material (tutors only)
- `GET /api/materials/:id` - Get specific material
- `DELETE /api/materials/:id` - Delete material (tutors only)

### Feedback
- `POST /api/feedback` - Submit feedback (students only)
- `GET /api/feedback/:materialId` - Get feedback for a material (tutors only)

## Next Steps

1. Set up Supabase database tables
2. Implement authentication routes
3. Add material management endpoints
4. Connect frontend to API



