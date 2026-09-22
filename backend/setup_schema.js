import PocketBase from 'pocketbase';

export async function setupSchema(pbUrl = 'http://127.0.0.1:8090', adminEmail = 'admin@wingfu.local', adminPassword = 'ChangeMeNow123!') {
  const pb = new PocketBase(pbUrl);

  // Authenticate as superuser / admin
  try {
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
  } catch (err) {
    // Fallback for pre-v0.23 admin collection
    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
    } catch (e) {
      console.error('Superuser authentication failed. Ensure admin account exists:', e.message);
      throw e;
    }
  }

  console.log('Authenticated as superuser.');

  // 1. Configure users collection
  const usersCollection = await pb.collections.getOne('users');
  usersCollection.listRule = '@request.auth.id != ""';
  usersCollection.viewRule = '@request.auth.id != ""';
  usersCollection.createRule = null; // Closed to public registration
  usersCollection.updateRule = '@request.auth.id = id';
  usersCollection.deleteRule = null;

  // Add display_name if not exists
  const existingUserFields = new Set(usersCollection.fields ? usersCollection.fields.map(f => f.name) : (usersCollection.schema || []).map(f => f.name));
  
  if (!existingUserFields.has('display_name')) {
    if (usersCollection.fields) {
      usersCollection.fields.push({
        name: 'display_name',
        type: 'text',
        max: 100,
      });
    } else {
      usersCollection.schema.push({
        name: 'display_name',
        type: 'text',
        options: { max: 100 },
      });
    }
  }

  await pb.collections.update(usersCollection.id, usersCollection);
  console.log('Users collection configured.');

  // 2. Configure messages collection
  const messagesRules = {
    name: 'messages',
    type: 'base',
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != "" && @request.body.sender = @request.auth.id',
    updateRule: '@request.auth.id != "" && @request.auth.id != sender && @request.body.text:isset = false && @request.body.sender:isset = false && @request.body.attachment:isset = false && @request.body.media_type:isset = false && @request.body.duration:isset = false',
    deleteRule: null,
  };

  const messagesFields = [
    {
      name: 'sender',
      type: 'relation',
      required: true,
      options: {
        collectionId: usersCollection.id,
        cascadeDelete: false,
        maxSelect: 1,
      },
      collectionId: usersCollection.id,
      cascadeDelete: false,
      maxSelect: 1,
    },
    {
      name: 'text',
      type: 'text',
      required: false,
      options: { max: 5000 },
      max: 5000,
    },
    {
      name: 'attachment',
      type: 'file',
      required: false,
      options: {
        maxSelect: 1,
        maxSize: 26214400,
        mimeTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac'
        ],
      },
      maxSelect: 1,
      maxSize: 26214400,
      mimeTypes: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac'
      ],
    },
    {
      name: 'media_type',
      type: 'select',
      required: true,
      options: {
        values: ['text', 'image', 'audio'],
        maxSelect: 1,
      },
      values: ['text', 'image', 'audio'],
      maxSelect: 1,
    },
    {
      name: 'duration',
      type: 'number',
      required: false,
      options: { min: 0 },
      min: 0,
    },
    {
      name: 'read_at',
      type: 'date',
      required: false,
    },
  ];

  try {
    const existing = await pb.collections.getOne('messages');
    await pb.collections.update(existing.id, {
      ...messagesRules,
      fields: messagesFields,
      schema: messagesFields,
    });
    console.log('Messages collection updated.');
  } catch (_) {
    await pb.collections.create({
      ...messagesRules,
      fields: messagesFields,
      schema: messagesFields,
    });
    console.log('Messages collection created.');
  }

  // 3. Configure chat_settings collection
  const settingsRules = {
    name: 'chat_settings',
    type: 'base',
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    createRule: null,
    deleteRule: null,
  };

  const settingsFields = [
    {
      name: 'archived_at',
      type: 'text',
      required: false,
      options: { max: 100 },
      max: 100,
    },
  ];

  let settingsCol;
  try {
    settingsCol = await pb.collections.getOne('chat_settings');
    await pb.collections.update(settingsCol.id, {
      ...settingsRules,
      fields: settingsFields,
      schema: settingsFields,
    });
    console.log('chat_settings collection updated.');
  } catch (_) {
    settingsCol = await pb.collections.create({
      ...settingsRules,
      fields: settingsFields,
      schema: settingsFields,
    });
    console.log('chat_settings collection created.');
  }

  // Seed default singleton record if empty
  const records = await pb.collection('chat_settings').getFullList();
  if (records.length === 0) {
    await pb.collection('chat_settings').create({ archived_at: '' });
    console.log('Seeded default singleton chat_settings record.');
  }

  console.log('Schema setup complete.');
}

if (process.argv[1] && process.argv[1].endsWith('setup_schema.js')) {
  setupSchema().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
}
