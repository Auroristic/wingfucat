import PocketBase from 'pocketbase';

export async function seedUsers(pbUrl = 'http://127.0.0.1:8090', adminEmail = 'admin@wingfu.local', adminPassword = 'ChangeMeNow123!') {
  const pb = new PocketBase(pbUrl);

  try {
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
  } catch (err) {
    await pb.admins.authWithPassword(adminEmail, adminPassword);
  }

  const partners = [
    {
      username: 'retro',
      email: 'retro@wingfu.local',
      password: 'RetroSecretPassword123!',
      passwordConfirm: 'RetroSecretPassword123!',
      display_name: 'Retro',
    },
    {
      username: 'partner',
      email: 'partner@wingfu.local',
      password: 'PartnerSecretPassword123!',
      passwordConfirm: 'PartnerSecretPassword123!',
      display_name: 'Partner',
    },
  ];

  for (const partner of partners) {
    try {
      await pb.collection('users').create(partner);
      console.log(`Created user ${partner.username}`);
    } catch (e) {
      console.log(`User ${partner.username} already exists or error:`, e.message);
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedUsers().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
