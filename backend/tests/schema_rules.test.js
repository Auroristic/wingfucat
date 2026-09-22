import test from 'node:test';
import assert from 'node:assert/strict';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';

test('PocketBase Schema & Rule Security Tests', async (t) => {
  const pbAnon = new PocketBase(PB_URL);
  const pbUser1 = new PocketBase(PB_URL);
  const pbUser2 = new PocketBase(PB_URL);

  let user1, user2;

  await t.test('1. Partner accounts can authenticate', async () => {
    const auth1 = await pbUser1.collection('users').authWithPassword('retro', 'RetroSecretPassword123!');
    assert.ok(auth1.token, 'User 1 authenticated');
    user1 = auth1.record;

    const auth2 = await pbUser2.collection('users').authWithPassword('partner', 'PartnerSecretPassword123!');
    assert.ok(auth2.token, 'User 2 authenticated');
    user2 = auth2.record;
  });

  await t.test('2. Unauthenticated client cannot access messages', async () => {
    await assert.rejects(
      async () => {
        await pbAnon.collection('messages').getList(1, 10);
      },
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
      'Unauthenticated read should be rejected'
    );
  });

  let createdMessage;

  await t.test('3. User 1 can send a valid message', async () => {
    createdMessage = await pbUser1.collection('messages').create({
      sender: user1.id,
      text: 'Hello from Retro!',
      media_type: 'text',
    });

    assert.ok(createdMessage.id);
    assert.equal(createdMessage.text, 'Hello from Retro!');
    assert.equal(createdMessage.sender, user1.id);
  });

  await t.test('4. User 1 cannot impersonate User 2 as sender', async () => {
    await assert.rejects(
      async () => {
        await pbUser1.collection('messages').create({
          sender: user2.id,
          text: 'Impersonated message',
          media_type: 'text',
        });
      },
      (err) => err.status === 400 || err.status === 403,
      'Impersonation must be rejected'
    );
  });

  await t.test('5. Message cannot exceed 5000 characters', async () => {
    const longText = 'a'.repeat(5001);
    await assert.rejects(
      async () => {
        await pbUser1.collection('messages').create({
          sender: user1.id,
          text: longText,
          media_type: 'text',
        });
      },
      (err) => err.status === 400,
      'Over-sized text must be rejected'
    );
  });

  await t.test('6. User cannot tamper with message text or sender on update', async () => {
    await assert.rejects(
      async () => {
        await pbUser2.collection('messages').update(createdMessage.id, {
          text: 'Tampered text',
        });
      },
      (err) => err.status === 400 || err.status === 403,
      'Tampering with text must fail'
    );

    await assert.rejects(
      async () => {
        await pbUser1.collection('messages').update(createdMessage.id, {
          text: 'Author self-editing text',
        });
      },
      (err) => err.status === 400 || err.status === 403,
      'Author editing text must fail'
    );
  });

  await t.test('7. Recipient can update read_at receipt', async () => {
    const readTimestamp = new Date().toISOString();
    const updated = await pbUser2.collection('messages').update(createdMessage.id, {
      read_at: readTimestamp,
    });

    assert.ok(updated.read_at);
  });
});
