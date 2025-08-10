# Database Setup for Groupifi Us

This directory contains the database schema and setup instructions for the Groupifi Us application.

## Prerequisites

- Supabase project created
- Supabase CLI installed (optional, for local development)

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Schema

#### Option A: Using Migration Scripts (Recommended)

1. Run the migration helper to see the SQL:
   ```bash
   npm run db:migrate
   ```

2. Copy the output SQL and paste it into your Supabase SQL Editor
3. Run the SQL script

#### Option B: Manual Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL script

This will create:
- All necessary tables (`saved_groups`, `constraints`, `grouping_sessions`)
- Row Level Security (RLS) policies
- Proper indexes for performance
- Triggers for automatic timestamp updates

### 4. Add Test Data (Optional)

For development and testing, you can add sample data:

1. Create test users in your Supabase Auth dashboard
2. Note their user UUIDs
3. Run the seed data helper:
   ```bash
   npm run db:seed
   ```
4. Replace the placeholder UUIDs in the output with your actual user UUIDs
5. Copy and paste the modified SQL into your Supabase SQL Editor

## Migration Scripts

The project includes helpful migration scripts to manage database setup:

- `npm run db:status` - Show available migrations and seeds
- `npm run db:migrate` - Output migration SQL to run in Supabase
- `npm run db:seed` - Output test data SQL for development
- `npm run db:reset` - Output SQL to reset database and rerun migrations

### 5. Configure Authentication

In your Supabase project dashboard:

1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://groupifi.us/auth/callback` (production)

### 6. Enable Google OAuth (Optional)

1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Configure authorized redirect URIs in Google Console

## Database Schema Overview

### Tables

- **saved_groups**: User's saved participant lists
- **constraints**: Grouping rules (hard/soft, together/apart)
- **grouping_sessions**: Historical grouping data for avoidance

### Security

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Cascade deletes maintain data integrity
- Proper indexes for performance

## Testing the Setup

After running the schema, you can test the authentication system by:

1. Starting the development server: `npm run dev`
2. Navigating to the auth page
3. Creating a test account
4. Verifying the user appears in the Supabase Auth dashboard

## Troubleshooting

### Common Issues

1. **RLS Policies Not Working**: Ensure you're using the correct user ID in policies
2. **OAuth Redirect Issues**: Check that redirect URLs match exactly
3. **Permission Errors**: Verify that RLS policies are properly configured

### Useful SQL Queries

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- View user data (as admin)
SELECT * FROM auth.users;
```