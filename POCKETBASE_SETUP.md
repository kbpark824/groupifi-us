# PocketBase Setup for Groupifi Us

This document describes the PocketBase setup process for migrating from Supabase to PocketBase.

## Quick Setup

Run the automated setup script:

```bash
./setup-pocketbase.sh
```

This will:
1. Start PocketBase server
2. Guide you through admin account creation
3. Automatically create all required collections
4. Configure user permissions and validation rules

## Manual Setup (Alternative)

If you prefer manual setup:

1. **Start PocketBase:**
   ```bash
   ./pocketbase serve --http=127.0.0.1:8090
   ```

2. **Create Admin Account:**
   - Open http://127.0.0.1:8090/_/
   - Create admin account: admin@groupifi.us / admin123456

3. **Run Collection Setup:**
   ```bash
   node setup-collections.js
   ```

## Collections Created

### saved_groups
- Stores user's saved participant lists
- Fields: name, participants (JSON), user_id (relation)
- User permissions: users can only access their own groups

### constraints
- Stores grouping constraints (hard/soft, together/apart)
- Fields: group_id (relation), person_a, person_b, constraint_type
- User permissions: users can only access constraints for their groups

### grouping_sessions
- Stores historical grouping data for avoidance
- Fields: group_id (relation), session_date, groups_data (JSON), participants_count
- User permissions: users can only access sessions for their groups

## Environment Configuration

The setup automatically adds to your `.env` file:

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

## Development Workflow

1. **Start PocketBase:** `./pocketbase serve`
2. **Admin Panel:** http://127.0.0.1:8090/_/
3. **API Health:** http://127.0.0.1:8090/api/health
4. **Stop PocketBase:** `pkill -f pocketbase`

## Next Steps

After PocketBase setup is complete:

1. Update frontend code to use PocketBase SDK instead of Supabase
2. Replace authentication context with PocketBase auth
3. Update all database operations to use PocketBase collections
4. Test all functionality with the new backend

## Files Created

- `pocketbase` - PocketBase binary
- `pb_data/` - PocketBase data directory (auto-created)
- `setup-collections.js` - Automated collection setup script
- `pocketbase-setup.md` - Manual setup guide
- `pocketbase-collections.json` - Collection schema definitions

## Troubleshooting

**Port already in use:**
```bash
pkill -f pocketbase
./pocketbase serve --http=127.0.0.1:8091
```

**Collections already exist:**
The setup script will skip existing collections and show warnings.

**Permission errors:**
Ensure you're authenticated as admin when running setup scripts.