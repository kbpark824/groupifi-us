#!/usr/bin/env node

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupCollections() {
  try {
    console.log('🔐 Authenticating as admin...');
    await pb.admins.authWithPassword('admin@groupifi.us', 'admin123456');
    console.log('✅ Admin authentication successful');

    // Check existing collections
    const collections = await pb.collections.getFullList();
    console.log('📋 Existing collections:', collections.map(c => c.name));

    // Create users collection if it doesn't exist (it should exist by default)
    const usersCollection = collections.find(c => c.name === 'users');
    if (!usersCollection) {
      console.log('❌ Users collection not found - this is unexpected');
      return;
    }

    console.log('✅ Users collection found:', usersCollection.id);

    // Create saved_groups collection
    let savedGroupsCollection = collections.find(c => c.name === 'saved_groups');
    if (!savedGroupsCollection) {
      console.log('📦 Creating saved_groups collection...');
      savedGroupsCollection = await pb.collections.create({
        name: 'saved_groups',
        type: 'base',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100
            }
          },
          {
            name: 'participants',
            type: 'json',
            required: true
          },
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            options: {
              collectionId: usersCollection.id,
              cascadeDelete: true,
              minSelect: 1,
              maxSelect: 1
            }
          }
        ],
        listRule: 'user_id = @request.auth.id',
        viewRule: 'user_id = @request.auth.id',
        createRule: 'user_id = @request.auth.id',
        updateRule: 'user_id = @request.auth.id',
        deleteRule: 'user_id = @request.auth.id'
      });
      console.log('✅ Created saved_groups collection');
    } else {
      console.log('⚠️  saved_groups collection already exists');
    }

    // Create constraints collection
    let constraintsCollection = collections.find(c => c.name === 'constraints');
    if (!constraintsCollection) {
      console.log('📦 Creating constraints collection...');
      constraintsCollection = await pb.collections.create({
        name: 'constraints',
        type: 'base',
        schema: [
          {
            name: 'group_id',
            type: 'relation',
            required: true,
            options: {
              collectionId: savedGroupsCollection.id,
              cascadeDelete: true,
              minSelect: 1,
              maxSelect: 1
            }
          },
          {
            name: 'person_a',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100
            }
          },
          {
            name: 'person_b',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100
            }
          },
          {
            name: 'constraint_type',
            type: 'select',
            required: true,
            options: {
              values: ['hard_together', 'hard_apart', 'soft_together', 'soft_apart']
            }
          }
        ],
        listRule: 'group_id.user_id = @request.auth.id',
        viewRule: 'group_id.user_id = @request.auth.id',
        createRule: 'group_id.user_id = @request.auth.id',
        updateRule: 'group_id.user_id = @request.auth.id',
        deleteRule: 'group_id.user_id = @request.auth.id'
      });
      console.log('✅ Created constraints collection');
    } else {
      console.log('⚠️  constraints collection already exists');
    }

    // Create grouping_sessions collection
    let sessionsCollection = collections.find(c => c.name === 'grouping_sessions');
    if (!sessionsCollection) {
      console.log('📦 Creating grouping_sessions collection...');
      sessionsCollection = await pb.collections.create({
        name: 'grouping_sessions',
        type: 'base',
        schema: [
          {
            name: 'group_id',
            type: 'relation',
            required: true,
            options: {
              collectionId: savedGroupsCollection.id,
              cascadeDelete: true,
              minSelect: 1,
              maxSelect: 1
            }
          },
          {
            name: 'session_date',
            type: 'date',
            required: true
          },
          {
            name: 'groups_data',
            type: 'json',
            required: true
          },
          {
            name: 'participants_count',
            type: 'number',
            required: true,
            options: {
              min: 1
            }
          }
        ],
        listRule: 'group_id.user_id = @request.auth.id',
        viewRule: 'group_id.user_id = @request.auth.id',
        createRule: 'group_id.user_id = @request.auth.id',
        updateRule: 'group_id.user_id = @request.auth.id',
        deleteRule: 'group_id.user_id = @request.auth.id'
      });
      console.log('✅ Created grouping_sessions collection');
    } else {
      console.log('⚠️  grouping_sessions collection already exists');
    }

    console.log('🎉 PocketBase collections setup complete!');
    console.log('');
    console.log('✅ Your app should now work with authentication');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
  }
}

setupCollections();