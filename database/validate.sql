-- Database Validation Script for Groupifi Us
-- Run this script to verify that your database schema is correctly set up

-- Check if all tables exist
SELECT 
    'Tables Check' as check_type,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ All tables exist'
        ELSE '❌ Missing tables: ' || (3 - COUNT(*))::text
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('saved_groups', 'constraints', 'grouping_sessions');

-- Check if all indexes exist
SELECT 
    'Indexes Check' as check_type,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ All indexes exist'
        ELSE '❌ Missing indexes: ' || (6 - COUNT(*))::text
    END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';

-- Check if RLS is enabled on all tables
SELECT 
    'RLS Check' as check_type,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ RLS enabled on all tables'
        ELSE '❌ RLS not enabled on all tables'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('saved_groups', 'constraints', 'grouping_sessions')
AND rowsecurity = true;

-- Check if all RLS policies exist
SELECT 
    'RLS Policies Check' as check_type,
    CASE 
        WHEN COUNT(*) >= 12 THEN '✅ All RLS policies exist'
        ELSE '❌ Missing RLS policies: ' || (12 - COUNT(*))::text
    END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- Check if trigger function exists
SELECT 
    'Trigger Function Check' as check_type,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ Trigger function exists'
        ELSE '❌ Trigger function missing'
    END as status
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Check if trigger exists
SELECT 
    'Trigger Check' as check_type,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ Update trigger exists'
        ELSE '❌ Update trigger missing'
    END as status
FROM pg_trigger 
WHERE tgname = 'update_saved_groups_updated_at';

-- Detailed table information
SELECT 
    'Table Details' as check_type,
    'saved_groups: ' || 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'saved_groups')::text || ' columns, ' ||
    'constraints: ' || 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'constraints')::text || ' columns, ' ||
    'grouping_sessions: ' || 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'grouping_sessions')::text || ' columns'
    as status;

-- Check foreign key constraints
SELECT 
    'Foreign Keys Check' as check_type,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ All foreign keys exist'
        ELSE '❌ Missing foreign keys: ' || (3 - COUNT(*))::text
    END as status
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public'
AND table_name IN ('saved_groups', 'constraints', 'grouping_sessions');

-- Summary
SELECT 
    '=== VALIDATION SUMMARY ===' as check_type,
    'Run this script after setting up your database to verify everything is working correctly.' as status;