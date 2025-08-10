-- Seed Data for Testing Groupifi Us Application
-- This file contains test data for development and testing purposes
-- Note: This assumes you have test users created in Supabase Auth

-- Test data for saved_groups
-- Replace 'test-user-uuid-1' and 'test-user-uuid-2' with actual user UUIDs from your auth.users table

-- Sample saved group 1: Small class
INSERT INTO public.saved_groups (id, user_id, name, participants, created_at, updated_at) VALUES
(
    'group-1-uuid',
    'test-user-uuid-1',
    'Math Class Section A',
    ARRAY['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown', 'Frank Miller', 'Grace Lee', 'Henry Taylor'],
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
);

-- Sample saved group 2: Workshop participants
INSERT INTO public.saved_groups (id, user_id, name, participants, created_at, updated_at) VALUES
(
    'group-2-uuid',
    'test-user-uuid-1',
    'Leadership Workshop',
    ARRAY['Sarah Connor', 'John Doe', 'Jane Smith', 'Mike Johnson', 'Lisa Wang', 'Tom Anderson', 'Amy Chen', 'Chris Brown', 'Diana Prince', 'Bruce Wayne'],
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '3 days'
);

-- Sample saved group 3: Large team
INSERT INTO public.saved_groups (id, user_id, name, participants, created_at, updated_at) VALUES
(
    'group-3-uuid',
    'test-user-uuid-2',
    'Company Retreat Team Building',
    ARRAY['Alex Rivera', 'Jordan Kim', 'Taylor Swift', 'Morgan Freeman', 'Casey Jones', 'Riley Cooper', 'Avery Johnson', 'Quinn Davis', 'Sage Wilson', 'River Thompson', 'Phoenix Martinez', 'Skyler Anderson'],
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 days'
);

-- Test constraints for the first group
INSERT INTO public.constraints (id, group_id, person_a, person_b, constraint_type, created_at) VALUES
(
    'constraint-1-uuid',
    'group-1-uuid',
    'Alice Johnson',
    'Bob Smith',
    'hard_together',
    NOW() - INTERVAL '6 days'
),
(
    'constraint-2-uuid',
    'group-1-uuid',
    'Carol Davis',
    'David Wilson',
    'hard_apart',
    NOW() - INTERVAL '6 days'
),
(
    'constraint-3-uuid',
    'group-1-uuid',
    'Emma Brown',
    'Frank Miller',
    'soft_together',
    NOW() - INTERVAL '5 days'
);

-- Test constraints for the second group
INSERT INTO public.constraints (id, group_id, person_a, person_b, constraint_type, created_at) VALUES
(
    'constraint-4-uuid',
    'group-2-uuid',
    'Sarah Connor',
    'John Doe',
    'hard_apart',
    NOW() - INTERVAL '4 days'
),
(
    'constraint-5-uuid',
    'group-2-uuid',
    'Mike Johnson',
    'Lisa Wang',
    'soft_together',
    NOW() - INTERVAL '4 days'
),
(
    'constraint-6-uuid',
    'group-2-uuid',
    'Tom Anderson',
    'Amy Chen',
    'hard_together',
    NOW() - INTERVAL '3 days'
);

-- Test grouping sessions (historical data)
INSERT INTO public.grouping_sessions (id, group_id, session_date, groups_data, participants_count) VALUES
(
    'session-1-uuid',
    'group-1-uuid',
    NOW() - INTERVAL '7 days',
    '[
        {
            "id": "group-1",
            "name": "Group 1",
            "members": ["Alice Johnson", "Bob Smith", "Emma Brown"],
            "size": 3
        },
        {
            "id": "group-2", 
            "name": "Group 2",
            "members": ["Carol Davis", "Frank Miller", "Grace Lee"],
            "size": 3
        },
        {
            "id": "group-3",
            "name": "Group 3", 
            "members": ["David Wilson", "Henry Taylor"],
            "size": 2
        }
    ]'::jsonb,
    8
),
(
    'session-2-uuid',
    'group-1-uuid',
    NOW() - INTERVAL '3 days',
    '[
        {
            "id": "group-1",
            "name": "Group 1",
            "members": ["Alice Johnson", "Bob Smith", "David Wilson"],
            "size": 3
        },
        {
            "id": "group-2",
            "name": "Group 2", 
            "members": ["Carol Davis", "Grace Lee", "Henry Taylor"],
            "size": 3
        },
        {
            "id": "group-3",
            "name": "Group 3",
            "members": ["Emma Brown", "Frank Miller"],
            "size": 2
        }
    ]'::jsonb,
    8
);

-- Test grouping session for second group
INSERT INTO public.grouping_sessions (id, group_id, session_date, groups_data, participants_count) VALUES
(
    'session-3-uuid',
    'group-2-uuid',
    NOW() - INTERVAL '4 days',
    '[
        {
            "id": "group-1",
            "name": "Group 1",
            "members": ["Sarah Connor", "Mike Johnson", "Lisa Wang", "Diana Prince"],
            "size": 4
        },
        {
            "id": "group-2",
            "name": "Group 2",
            "members": ["John Doe", "Jane Smith", "Chris Brown", "Bruce Wayne"],
            "size": 4
        },
        {
            "id": "group-3",
            "name": "Group 3",
            "members": ["Tom Anderson", "Amy Chen"],
            "size": 2
        }
    ]'::jsonb,
    10
);

-- Additional test data for edge cases

-- Group with odd number of participants
INSERT INTO public.saved_groups (id, user_id, name, participants, created_at, updated_at) VALUES
(
    'group-4-uuid',
    'test-user-uuid-1',
    'Odd Number Test Group',
    ARRAY['Person A', 'Person B', 'Person C', 'Person D', 'Person E', 'Person F', 'Person G'],
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
);

-- Group with minimum participants (for testing edge cases)
INSERT INTO public.saved_groups (id, user_id, name, participants, created_at, updated_at) VALUES
(
    'group-5-uuid',
    'test-user-uuid-2',
    'Minimum Size Group',
    ARRAY['Alpha', 'Beta', 'Gamma', 'Delta'],
    NOW() - INTERVAL '1 day',
    NOW()
);

-- Constraints that might create conflicts (for testing constraint resolution)
INSERT INTO public.constraints (id, group_id, person_a, person_b, constraint_type, created_at) VALUES
(
    'constraint-7-uuid',
    'group-4-uuid',
    'Person A',
    'Person B',
    'hard_together',
    NOW() - INTERVAL '1 day'
),
(
    'constraint-8-uuid',
    'group-4-uuid',
    'Person A',
    'Person C',
    'hard_together',
    NOW() - INTERVAL '1 day'
),
(
    'constraint-9-uuid',
    'group-4-uuid',
    'Person B',
    'Person C',
    'hard_apart',
    NOW() - INTERVAL '1 day'
);

-- Note: To use this seed data, you need to:
-- 1. Create test users in Supabase Auth
-- 2. Replace 'test-user-uuid-1' and 'test-user-uuid-2' with actual user UUIDs
-- 3. Run this script in your Supabase SQL editor or via migration