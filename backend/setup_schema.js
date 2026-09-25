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

  // Add display_name and username if not exists
  const existingUserFields = new Set(usersCollection.fields ? usersCollection.fields.map(f => f.name) : (usersCollection.schema || []).map(f => f.name));
  
  if (usersCollection.fields) {
    if (!existingUserFields.has('username')) {
      usersCollection.fields.push({
        name: 'username',
        type: 'text',
        required: false,
        min: 3,
        max: 50,
      });
    }
    if (!existingUserFields.has('display_name')) {
      usersCollection.fields.push({
        name: 'display_name',
        type: 'text',
        max: 100,
      });
    }
    if (!existingUserFields.has('last_seen')) {
      usersCollection.fields.push({
        name: 'last_seen',
        type: 'date',
        required: false,
      });
    }
    if (!existingUserFields.has('typing_until')) {
      usersCollection.fields.push({
        name: 'typing_until',
        type: 'text',
        required: false,
      });
    }
    if (!existingUserFields.has('is_online')) {
      usersCollection.fields.push({
        name: 'is_online',
        type: 'bool',
        required: false,
      });
    }
    if (!existingUserFields.has('is_typing')) {
      usersCollection.fields.push({
        name: 'is_typing',
        type: 'bool',
        required: false,
      });
    }
    if (!existingUserFields.has('theme_settings')) {
      usersCollection.fields.push({
        name: 'theme_settings',
        type: 'json',
        required: false,
      });
    }
    usersCollection.indexes = usersCollection.indexes || [];
    if (!usersCollection.indexes.some(i => i.includes('username'))) {
      usersCollection.indexes.push('CREATE UNIQUE INDEX idx_users_username ON users (username) WHERE username != ""');
    }
    usersCollection.passwordAuth = {
      enabled: true,
      identityFields: ['email', 'username']
    };
  } else {
    if (!existingUserFields.has('display_name')) {
      usersCollection.schema.push({
        name: 'display_name',
        type: 'text',
        options: { max: 100 },
      });
    }
    if (!existingUserFields.has('last_seen')) {
      usersCollection.schema.push({
        name: 'last_seen',
        type: 'date',
        required: false,
      });
    }
    if (!existingUserFields.has('typing_until')) {
      usersCollection.schema.push({
        name: 'typing_until',
        type: 'text',
        required: false,
      });
    }
    if (!existingUserFields.has('is_online')) {
      usersCollection.schema.push({
        name: 'is_online',
        type: 'bool',
        required: false,
      });
    }
    if (!existingUserFields.has('is_typing')) {
      usersCollection.schema.push({
        name: 'is_typing',
        type: 'bool',
        required: false,
      });
    }
    if (!existingUserFields.has('theme_settings')) {
      usersCollection.schema.push({
        name: 'theme_settings',
        type: 'json',
        required: false,
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
    updateRule: '@request.auth.id != "" && @request.body.text:isset = false && @request.body.sender:isset = false && @request.body.attachment:isset = false && @request.body.media_type:isset = false && @request.body.duration:isset = false && @request.body.file_name:isset = false && @request.body.file_size:isset = false && @request.body.reply_to:isset = false && (@request.auth.id != sender || @request.body.read_at:isset = false)',
    deleteRule: '@request.auth.id != ""',
  };

  let existingMessagesCollection = null;
  try {
    existingMessagesCollection = await pb.collections.getOne('messages');
  } catch (_) {}

  const messagesCollectionId = existingMessagesCollection ? existingMessagesCollection.id : 'messages';

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
        maxSize: 52428800,
        mimeTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac',
          'video/mp4', 'video/webm', 'video/quicktime',
          'application/pdf', 'application/zip', 'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
      },
      maxSelect: 1,
      maxSize: 52428800,
      mimeTypes: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf', 'application/zip', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
    },
    {
      name: 'media_type',
      type: 'select',
      required: true,
      options: {
        values: ['text', 'image', 'audio', 'video', 'file'],
        maxSelect: 1,
      },
      values: ['text', 'image', 'audio', 'video', 'file'],
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
      name: 'file_name',
      type: 'text',
      required: false,
      options: { max: 255 },
      max: 255,
    },
    {
      name: 'file_size',
      type: 'number',
      required: false,
      options: { min: 0 },
      min: 0,
    },
    {
      name: 'reply_to',
      type: 'relation',
      required: false,
      options: {
        collectionId: messagesCollectionId,
        cascadeDelete: false,
        maxSelect: 1,
      },
      collectionId: messagesCollectionId,
      cascadeDelete: false,
      maxSelect: 1,
    },
    {
      name: 'is_pinned',
      type: 'bool',
      required: false,
    },
    {
      name: 'pinned_at',
      type: 'date',
      required: false,
    },
    {
      name: 'read_at',
      type: 'date',
      required: false,
    },
    {
      name: 'created',
      type: 'autodate',
      onCreate: true,
      onUpdate: false,
    },
    {
      name: 'updated',
      type: 'autodate',
      onCreate: true,
      onUpdate: true,
    },
  ];

  try {
    const existing = existingMessagesCollection || await pb.collections.getOne('messages');
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
    {
      name: 'created',
      type: 'autodate',
      onCreate: true,
      onUpdate: false,
    },
    {
      name: 'updated',
      type: 'autodate',
      onCreate: true,
      onUpdate: true,
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
  const pbUrl = process.argv[2] || process.env.PB_URL || 'http://127.0.0.1:8090';
  const adminEmail = process.argv[3] || process.env.ADMIN_EMAIL || 'admin@wingfu.local';
  const adminPassword = process.argv[4] || process.env.ADMIN_PASSWORD || 'ChangeMeNow123!';

  setupSchema(pbUrl, adminEmail, adminPassword).catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
}
