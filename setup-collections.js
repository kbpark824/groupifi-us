#!/usr/bin/env node

/**
 * Automated PocketBase Collections Setup
 * Run this after creating the admin account manually
 */

const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupCollections() {
  try {
    console.log('🚀 Setting up PocketBase collections...');

    // Authenticate as admin
    console.log('🔐 Please enter admin credentials:');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const email = await new Promise(resolve => {
      readline.question('Admin email (default: admin@groupifi.us): ', (answer) => {
        resolve(answer || 'admin@groupifi.us');
      });
    });

    const password = await new Promise(resolve => {
      readline.question('Admin password: ', (answer) => {
        resolve(answer);
      });
    });

    readline.close();

    await pb.admins.authWithPassword(email, password);
    console.log('✅ Admin authentication successful');

    // Create saved_groups collection
    await createSavedGroupsCollection();
    
    // Create constraints collection
    await createConstraintsCollection();
    
    // Create grouping_sessions collection
    await createGroupingSessionsCollection();
    
    console.log('🎉 Collections setup complete!');
    console.log('');
    console.log('✅ Created collections:');
    console.log('   - saved_groups');
    console.log('   - constraints');
    console.log('   - grouping_sessions');
    console.log('');
    console.log('Next steps:');
    console.log('1. Add VITE_POCKETBASE_URL=http://127.0.0.1:8090 to your .env file');
    console.log('2. Update your frontend code to use PocketBase');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
    process.exit(1);
  }
}

async function createSavedGroupsCollection() {
  console.log('📦 Creating saved_groups collection...');
  
  try {
    await pb.collections.create({
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
          required: true,
          options: {
            maxSize: 2000000
          }
        },
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
            displayFields: ['email']
          }
        }
      ],
      indexes: [
        'CREATE INDEX idx_saved_groups_user_id ON saved_groups (user_id)'
      ],
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: 'user_id = @request.auth.id',
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id'
    });
    console.log('✅ Created saved_groups collection');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  saved_groups collection already exists');
    } else {
      throw error;
    }
  }
}

async function createConstraintsCollection() {
  console.log('📦 Creating constraints collection...');
  
  try {
    // Get saved_groups collection ID
    const collections = await pb.collections.getFullList();
    const savedGroupsCollection = collections.find(c => c.name === 'saved_groups');
    
    if (!savedGroupsCollection) {
      throw new Error('saved_groups collection not found');
    }

    await pb.collections.create({
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
            maxSelect: 1,
            displayFields: ['name']
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
            maxSelect: 1,
            values: ['hard_together', 'hard_apart', 'soft_together', 'soft_apart']
          }
        }
      ],
      indexes: [
        'CREATE INDEX idx_constraints_group_id ON constraints (group_id)'
      ],
      listRule: 'group_id.user_id = @request.auth.id',
      viewRule: 'group_id.user_id = @request.auth.id',
      createRule: 'group_id.user_id = @request.auth.id',
      updateRule: 'group_id.user_id = @request.auth.id',
      deleteRule: 'group_id.user_id = @request.auth.id'
    });
    console.log('✅ Created constraints collection');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  constraints collection already exists');
    } else {
      throw error;
    }
  }
}

async function createGroupingSessionsCollection() {
  console.log('📦 Creating grouping_sessions collection...');
  
  try {
    // Get saved_groups collection ID
    const collections = await pb.collections.getFullList();
    const savedGroupsCollection = collections.find(c => c.name === 'saved_groups');
    
    if (!savedGroupsCollection) {
      throw new Error('saved_groups collection not found');
    }

    await pb.collections.create({
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
            maxSelect: 1,
            displayFields: ['name']
          }
        },
        {
          name: 'session_date',
          type: 'date',
          required: true,
          options: {
            min: '',
            max: ''
          }
        },
        {
          name: 'groups_data',
          type: 'json',
          required: true,
          options: {
            maxSize: 2000000
          }
        },
        {
          name: 'participants_count',
          type: 'number',
          required: true,
          options: {
            min: 1,
            max: null,
            noDecimal: true
          }
        }
      ],
      indexes: [
        'CREATE INDEX idx_grouping_sessions_group_id ON grouping_sessions (group_id)',
        'CREATE INDEX idx_grouping_sessions_date ON grouping_sessions (session_date)'
      ],
      listRule: 'group_id.user_id = @request.auth.id',
      viewRule: 'group_id.user_id = @request.auth.id',
      createRule: 'group_id.user_id = @request.auth.id',
      updateRule: 'group_id.user_id = @request.auth.id',
      deleteRule: 'group_id.user_id = @request.auth.id'
    });
    console.log('✅ Created grouping_sessions collection');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  grouping_sessions collection already exists');
    } else {
      throw error;
    }
  }
}

// Run setup
setupCollections().catch(console.error);