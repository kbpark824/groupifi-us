#!/usr/bin/env node

/**
 * PocketBase Setup Script
 * This script configures PocketBase collections and settings for Groupifi Us
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupPocketBase() {
  try {
    console.log('🚀 Setting up PocketBase for Groupifi Us...');

    // First, we need to create an admin account
    // This will be done manually through the web interface at http://127.0.0.1:8090/_/
    console.log('📝 Please create an admin account at: http://127.0.0.1:8090/_/');
    console.log('   Use these credentials for development:');
    console.log('   Email: admin@groupifi.us');
    console.log('   Password: admin123456');
    console.log('');
    console.log('⏳ Waiting for admin account creation...');
    
    // Wait for user to create admin account
    await new Promise(resolve => {
      import('readline').then(({ createInterface }) => {
        const readline = createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question('Press Enter after creating the admin account...', () => {
          readline.close();
          resolve();
        });
      });
    });

    // Authenticate as admin
    console.log('🔐 Authenticating as admin...');
    await pb.admins.authWithPassword('admin@groupifi.us', 'admin123456');
    console.log('✅ Admin authentication successful');

    // Create collections
    await createCollections();
    
    // Configure authentication providers
    await configureAuth();
    
    console.log('🎉 PocketBase setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your .env file with PocketBase URL');
    console.log('2. Install pocketbase npm package: npm install pocketbase');
    console.log('3. Update your frontend to use PocketBase instead of Supabase');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

async function createCollections() {
  console.log('📦 Creating collections...');

  // Create saved_groups collection
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
          required: true
        },
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: '_pb_users_auth_',
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
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  saved_groups collection already exists');
    } else {
      throw error;
    }
  }

  // Create constraints collection
  try {
    await pb.collections.create({
      name: 'constraints',
      type: 'base',
      schema: [
        {
          name: 'group_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: '', // Will be set after getting saved_groups ID
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
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  constraints collection already exists');
    } else {
      throw error;
    }
  }

  // Create grouping_sessions collection
  try {
    await pb.collections.create({
      name: 'grouping_sessions',
      type: 'base',
      schema: [
        {
          name: 'group_id',
          type: 'relation',
          required: true,
          options: {
            collectionId: '', // Will be set after getting saved_groups ID
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
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  grouping_sessions collection already exists');
    } else {
      throw error;
    }
  }

  // Update relation fields with correct collection IDs
  await updateRelationFields();
}

async function updateRelationFields() {
  console.log('🔗 Updating relation fields...');
  
  try {
    // Get saved_groups collection ID
    const collections = await pb.collections.getFullList();
    const savedGroupsCollection = collections.find(c => c.name === 'saved_groups');
    
    if (savedGroupsCollection) {
      // Update constraints collection
      const constraintsCollection = collections.find(c => c.name === 'constraints');
      if (constraintsCollection) {
        const constraintsSchema = constraintsCollection.schema;
        const groupIdField = constraintsSchema.find(f => f.name === 'group_id');
        if (groupIdField) {
          groupIdField.options.collectionId = savedGroupsCollection.id;
          await pb.collections.update(constraintsCollection.id, {
            schema: constraintsSchema
          });
        }
      }

      // Update grouping_sessions collection
      const sessionsCollection = collections.find(c => c.name === 'grouping_sessions');
      if (sessionsCollection) {
        const sessionsSchema = sessionsCollection.schema;
        const groupIdField = sessionsSchema.find(f => f.name === 'group_id');
        if (groupIdField) {
          groupIdField.options.collectionId = savedGroupsCollection.id;
          await pb.collections.update(sessionsCollection.id, {
            schema: sessionsSchema
          });
        }
      }
    }
    
    console.log('✅ Updated relation fields');
  } catch (error) {
    console.log('⚠️  Could not update relation fields:', error.message);
  }
}

async function configureAuth() {
  console.log('🔐 Configuring authentication providers...');
  
  try {
    // Get current settings
    const settings = await pb.settings.getAll();
    
    // Configure email/password auth
    settings.meta = {
      ...settings.meta,
      appName: 'Groupifi Us',
      appUrl: 'http://localhost:5173',
      senderName: 'Groupifi Us',
      senderAddress: 'noreply@groupifi.us'
    };

    // Enable email/password auth (should be enabled by default)
    settings.emailAuth = {
      enabled: true,
      exceptDomains: [],
      onlyDomains: [],
      minPasswordLength: 8
    };

    // Configure Google OAuth (placeholder - requires actual credentials)
    settings.googleAuth = {
      enabled: false, // Will be enabled when credentials are added
      clientId: '',
      clientSecret: ''
    };

    await pb.settings.update(settings);
    console.log('✅ Authentication providers configured');
    console.log('ℹ️  Google OAuth is disabled - add credentials in admin panel to enable');
    
  } catch (error) {
    console.log('⚠️  Could not configure auth settings:', error.message);
  }
}

// Run setup
setupPocketBase().catch(console.error);