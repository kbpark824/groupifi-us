# PocketBase Setup Guide for Groupifi Us

## Step 1: Start PocketBase
```bash
./pocketbase serve --http=127.0.0.1:8090
```

## Step 2: Create Admin Account
1. Open http://127.0.0.1:8090/_/ in your browser
2. Create admin account with:
   - Email: admin@groupifi.us
   - Password: admin123456

## Step 3: Configure Collections

### saved_groups Collection
- Name: `saved_groups`
- Type: Base
- Schema:
  - `name` (Text, Required, Min: 1, Max: 100)
  - `participants` (JSON, Required)
  - `user_id` (Relation to users, Required, Cascade delete)
- API Rules:
  - List: `user_id = @request.auth.id`
  - View: `user_id = @request.auth.id`
  - Create: `user_id = @request.auth.id`
  - Update: `user_id = @request.auth.id`
  - Delete: `user_id = @request.auth.id`

### constraints Collection
- Name: `constraints`
- Type: Base
- Schema:
  - `group_id` (Relation to saved_groups, Required, Cascade delete)
  - `person_a` (Text, Required, Min: 1, Max: 100)
  - `person_b` (Text, Required, Min: 1, Max: 100)
  - `constraint_type` (Select, Required, Values: hard_together, hard_apart, soft_together, soft_apart)
- API Rules:
  - List: `group_id.user_id = @request.auth.id`
  - View: `group_id.user_id = @request.auth.id`
  - Create: `group_id.user_id = @request.auth.id`
  - Update: `group_id.user_id = @request.auth.id`
  - Delete: `group_id.user_id = @request.auth.id`

### grouping_sessions Collection
- Name: `grouping_sessions`
- Type: Base
- Schema:
  - `group_id` (Relation to saved_groups, Required, Cascade delete)
  - `session_date` (Date, Required)
  - `groups_data` (JSON, Required)
  - `participants_count` (Number, Required, Min: 1)
- API Rules:
  - List: `group_id.user_id = @request.auth.id`
  - View: `group_id.user_id = @request.auth.id`
  - Create: `group_id.user_id = @request.auth.id`
  - Update: `group_id.user_id = @request.auth.id`
  - Delete: `group_id.user_id = @request.auth.id`

## Step 4: Configure Authentication
1. Go to Settings > Auth providers
2. Email/Password should be enabled by default
3. For Google OAuth (optional for now):
   - Enable Google OAuth
   - Add Client ID and Client Secret when available

## Environment Variables
Add to your `.env` file:
```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```