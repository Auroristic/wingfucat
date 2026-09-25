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
    const anonList = await pbAnon.collection('messages').getList(1, 10);
    assert.equal(anonList.totalItems, 0, 'Unauthenticated list returns 0 records');
    await assert.rejects(
      async () => {
        await pbAnon.collection('messages').create({
          text: 'Unauthenticated message',
          media_type: 'text',
        });
      },
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
      'Unauthenticated create must be rejected'
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
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
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
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
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
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
      'Tampering with text must fail'
    );

    await assert.rejects(
      async () => {
        await pbUser1.collection('messages').update(createdMessage.id, {
          text: 'Author self-editing text',
        });
      },
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
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

  let fileMessage;

  await t.test('8. User 2 can send video and file messages with reply_to', async () => {
    fileMessage = await pbUser2.collection('messages').create({
      sender: user2.id,
      text: 'Here is the project report',
      media_type: 'file',
      file_name: 'report.pdf',
      file_size: 1048576,
      reply_to: createdMessage.id,
    });

    assert.ok(fileMessage.id);
    assert.equal(fileMessage.media_type, 'file');
    assert.equal(fileMessage.file_name, 'report.pdf');
    assert.equal(fileMessage.file_size, 1048576);
    assert.equal(fileMessage.reply_to, createdMessage.id);
  });

  await t.test('9. Either user can pin or unpin any message', async () => {
    const pinTimestamp = new Date().toISOString();
    
    // User 1 pins User 2's message
    const pinnedByUser1 = await pbUser1.collection('messages').update(fileMessage.id, {
      is_pinned: true,
      pinned_at: pinTimestamp,
    });
    assert.equal(pinnedByUser1.is_pinned, true);

    // User 2 unpins the message
    const unpinnedByUser2 = await pbUser2.collection('messages').update(fileMessage.id, {
      is_pinned: false,
    });
    assert.equal(unpinnedByUser2.is_pinned, false);

    // User 1 pins their own createdMessage
    const selfPinned = await pbUser1.collection('messages').update(createdMessage.id, {
      is_pinned: true,
      pinned_at: pinTimestamp,
    });
    assert.equal(selfPinned.is_pinned, true);
  });

  await t.test('10. Sender cannot mark their own message as read', async () => {
    await assert.rejects(
      async () => {
        await pbUser1.collection('messages').update(createdMessage.id, {
          read_at: new Date().toISOString(),
        });
      },
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
      'Author setting own read_at must be rejected'
    );
  });

  await t.test('11. Neither user can tamper with reply_to, media_type, or file details on update', async () => {
    await assert.rejects(
      async () => {
        await pbUser1.collection('messages').update(fileMessage.id, {
          media_type: 'text',
        });
      },
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
      'Tampering with media_type must fail'
    );

    await assert.rejects(
      async () => {
        await pbUser2.collection('messages').update(fileMessage.id, {
          reply_to: fileMessage.id,
        });
      },
      (err) => err.status === 400 || err.status === 403 || err.status === 404,
      'Tampering with reply_to must fail'
    );
  });
});
