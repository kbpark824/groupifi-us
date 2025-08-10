#!/usr/bin/env node

/**
 * Database Migration Runner for Groupifi Us
 * 
 * This script helps run database migrations and seed data for the Groupifi Us application.
 * It can be used for both development and production environments.
 * 
 * Usage:
 *   node database/migrate.js --help
 *   node database/migrate.js --migrate
 *   node database/migrate.js --seed
 *   node database/migrate.js --reset
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SEEDS_DIR = path.join(__dirname, 'seeds');

// Help text
const HELP_TEXT = `
Database Migration Runner for Groupifi Us

Usage:
  node database/migrate.js [options]

Options:
  --help      Show this help message
  --migrate   Run all pending migrations
  --seed      Run seed data (for testing/development)
  --reset     Reset database (drop and recreate all tables)
  --status    Show migration status

Examples:
  node database/migrate.js --migrate
  node database/migrate.js --seed
  node database/migrate.js --reset --migrate --seed

Note: This script outputs SQL that should be run in your Supabase SQL editor.
      For automated execution, you would need to integrate with Supabase CLI.
`;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  help: args.includes('--help'),
  migrate: args.includes('--migrate'),
  seed: args.includes('--seed'),
  reset: args.includes('--reset'),
  status: args.includes('--status')
};

// Main execution
function main() {
  if (options.help || args.length === 0) {
    console.log(HELP_TEXT);
    return;
  }

  console.log('='.repeat(60));
  console.log('Groupifi Us Database Migration Runner');
  console.log('='.repeat(60));
  console.log();

  if (options.status) {
    showStatus();
  }

  if (options.reset) {
    showResetSQL();
  }

  if (options.migrate) {
    runMigrations();
  }

  if (options.seed) {
    runSeeds();
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Migration runner complete!');
  console.log('Copy and paste the SQL above into your Supabase SQL editor.');
  console.log('='.repeat(60));
}

function showStatus() {
  console.log('📊 Migration Status');
  console.log('-'.repeat(40));
  
  try {
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration file(s):`);
    migrationFiles.forEach(file => {
      console.log(`  ✓ ${file}`);
    });
  } catch (error) {
    console.log('  ❌ No migrations directory found');
  }

  try {
    const seedFiles = fs.readdirSync(SEEDS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${seedFiles.length} seed file(s):`);
    seedFiles.forEach(file => {
      console.log(`  ✓ ${file}`);
    });
  } catch (error) {
    console.log('  ❌ No seeds directory found');
  }
  
  console.log();
}

function showResetSQL() {
  console.log('🔄 Database Reset SQL');
  console.log('-'.repeat(40));
  console.log();
  console.log('-- WARNING: This will delete all data!');
  console.log('-- Run this in your Supabase SQL editor to reset the database');
  console.log();
  console.log('-- Drop all tables and policies');
  console.log('DROP TABLE IF EXISTS public.grouping_sessions CASCADE;');
  console.log('DROP TABLE IF EXISTS public.constraints CASCADE;');
  console.log('DROP TABLE IF EXISTS public.saved_groups CASCADE;');
  console.log('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');
  console.log();
  console.log('-- Drop all policies (they will be recreated with tables)');
  console.log('-- Policies are automatically dropped with tables');
  console.log();
}

function runMigrations() {
  console.log('🚀 Running Migrations');
  console.log('-'.repeat(40));
  console.log();

  try {
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }

    migrationFiles.forEach(file => {
      console.log(`-- Running migration: ${file}`);
      console.log(`-- File: ${path.join(MIGRATIONS_DIR, file)}`);
      console.log();
      
      const migrationSQL = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(migrationSQL);
      console.log();
      console.log(`-- End of migration: ${file}`);
      console.log();
    });

  } catch (error) {
    console.error('Error running migrations:', error.message);
  }
}

function runSeeds() {
  console.log('🌱 Running Seed Data');
  console.log('-'.repeat(40));
  console.log();
  console.log('-- WARNING: Make sure to replace test-user-uuid-1 and test-user-uuid-2');
  console.log('-- with actual user UUIDs from your auth.users table');
  console.log();

  try {
    const seedFiles = fs.readdirSync(SEEDS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (seedFiles.length === 0) {
      console.log('No seed files found.');
      return;
    }

    seedFiles.forEach(file => {
      console.log(`-- Running seed: ${file}`);
      console.log(`-- File: ${path.join(SEEDS_DIR, file)}`);
      console.log();
      
      const seedSQL = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');
      console.log(seedSQL);
      console.log();
      console.log(`-- End of seed: ${file}`);
      console.log();
    });

  } catch (error) {
    console.error('Error running seeds:', error.message);
  }
}

// Run the script
main();