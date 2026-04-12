# Student Club Portal

A modern web-based club portal for students with dual authentication methods and file management capabilities.

## Features

- **Dual Authentication**: Username/password and QR code scan from student ID
- **Private Dashboard**: Personal workspace for each club member
- **File Management**: Upload, organize, download, and share images/videos
- **Folder Organization**: Hierarchical folder structure for easy content management
- **Security**: User-specific content access with JWT authentication
- **Modern UI**: Fast, responsive, and student-friendly interface

## Tech Stack

### Frontend
- Next.js 14 with TypeScript
- React 18
- TailwindCSS
- shadcn/ui
- Lucide React
- React Query
- React Hook Form

### Backend
- Node.js with Next.js API routes
- PostgreSQL with Prisma ORM
- JWT authentication
- bcrypt for password hashing
- Multer for file uploads
- QR code handling

### Storage
- Cloudinary for media storage (production)
- Local filesystem (development)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Create an admin user (required for first setup):
   ```bash
   npm run db:seed-admin
   ```
   - Default credentials: `admin` / `admin123`
   - Change the password after first login!

5. Start development server:
   ```bash
   npm run dev
   ```

## Admin User Management

- Only admins can create new users via the **Admin Panel** (`/dashboard/admin`).
- The public registration form has been removed for privacy.
- Use the `db:seed-admin` script to create the first admin or reset credentials.
- To promote an existing user to admin, update their `role` in the database to `ADMIN`.

## Project Structure

```
club-portal/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utilities and configurations
│   ├── types/               # TypeScript type definitions
│   └── hooks/               # Custom React hooks
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
└── docs/                    # Documentation
```

## License

MIT
