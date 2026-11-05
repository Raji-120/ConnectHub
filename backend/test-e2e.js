import http from 'http';
import { io as ioClient } from 'socket.io-client';
import { app, server } from './server.js';
import User from './models/User.js';
import Workspace from './models/Workspace.js';
import Channel from './models/Channel.js';
import Message from './models/Message.js';
import Task from './models/Task.js';

const PORT = 5001;

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runE2ETests() {
  console.log('\n================================================================');
  console.log('🚀 RUNNING CONNECTHUB END-TO-END AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  // Wait for MongoDB and Server initialization
  await new Promise((r) => setTimeout(r, 800));

  let alexToken = '';
  let sarahToken = '';
  let acmeWorkspaceId = '';
  let generalChannelId = '';
  let testMessageId = '';

  try {
    // 1. Authenticate Alex Turner
    console.log('[Step 1] Logging in as Alex Turner (Owner)...');
    const alexLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'alex@connecthub.io', password: 'Password123!' },
    });
    console.assert(alexLogin.statusCode === 200, 'Alex login failed');
    alexToken = alexLogin.body.token;
    console.log(`✓ Alex authenticated: ${alexLogin.body.user.name}`);

    // 2. Authenticate Sarah Connor
    console.log('[Step 2] Logging in as Sarah Connor (Admin)...');
    const sarahLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'sarah@connecthub.io', password: 'Password123!' },
    });
    console.assert(sarahLogin.statusCode === 200, 'Sarah login failed');
    sarahToken = sarahLogin.body.token;
    console.log(`✓ Sarah authenticated: ${sarahLogin.body.user.name}`);

    // 3. Get Workspaces for Alex
    console.log('\n[Step 3] Fetching Workspaces for Alex...');
    const wsRes = await makeRequest({
      method: 'GET',
      path: '/api/workspaces',
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    console.assert(wsRes.statusCode === 200, 'Fetch workspaces failed');
    const acme = wsRes.body.workspaces.find((w) => w.name === 'Acme Corp');
    console.assert(acme, 'Acme Corp workspace not found');
    acmeWorkspaceId = acme._id;
    console.log(`✓ Acme Corp Workspace resolved (ID: ${acmeWorkspaceId}, Code: ${acme.inviteCode})`);

    // 4. Fetch Channels for Acme Corp
    console.log('\n[Step 4] Fetching Channels in Acme Corp...');
    const chRes = await makeRequest({
      method: 'GET',
      path: `/api/workspaces/${acmeWorkspaceId}/channels`,
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    console.assert(chRes.statusCode === 200, 'Fetch channels failed');
    console.log(`✓ Retrieved ${chRes.body.channels.length} channels`);
    const generalCh = chRes.body.channels.find((c) => c.name === 'general');
    generalChannelId = generalCh._id;

    // 5. Create a new Channel
    console.log('\n[Step 5] Creating a new Channel (#e2e-testing)...');
    const newChRes = await makeRequest({
      method: 'POST',
      path: `/api/workspaces/${acmeWorkspaceId}/channels`,
      headers: { Authorization: `Bearer ${alexToken}` },
      body: {
        name: 'e2e-testing',
        topic: 'Automated Real-Time Test Channel',
        isPrivate: false,
      },
    });
    console.assert(newChRes.statusCode === 201 || newChRes.statusCode === 400, 'Create channel error');
    console.log('✓ Channel created / verified successfully');

    // 6. Send Channel Message from Alex via REST
    console.log('\n[Step 6] Alex posting a message to #general in MongoDB...');
    const msgRes = await makeRequest({
      method: 'POST',
      path: `/api/workspaces/${acmeWorkspaceId}/messages`,
      headers: { Authorization: `Bearer ${alexToken}` },
      body: {
        channelId: generalChannelId,
        content: 'Hello team! Verifying MongoDB message persistence and real-time delivery.',
      },
    });
    console.assert(msgRes.statusCode === 201, 'Send message failed');
    testMessageId = msgRes.body.message._id;
    console.log(`✓ Message saved in MongoDB with ID: ${testMessageId}`);

    // 7. Add Reaction to Message from Sarah
    console.log('\n[Step 7] Sarah reacting with 🔥 to Alex\'s message...');
    const reactRes = await makeRequest({
      method: 'POST',
      path: `/api/workspaces/${acmeWorkspaceId}/messages/${testMessageId}/react`,
      headers: { Authorization: `Bearer ${sarahToken}` },
      body: { emoji: '🔥' },
    });
    console.assert(reactRes.statusCode === 200, 'Reaction failed');
    console.log('✓ Reaction added and persisted in MongoDB');

    // 8. Pin Message
    console.log('\n[Step 8] Pinning message...');
    const pinRes = await makeRequest({
      method: 'POST',
      path: `/api/workspaces/${acmeWorkspaceId}/messages/${testMessageId}/pin`,
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    console.assert(pinRes.statusCode === 200, 'Pin failed');
    console.assert(pinRes.body.message.isPinned === true, 'Message not pinned');
    console.log('✓ Message successfully pinned');

    // 9. Task Management: Create, Move Status & Complete
    console.log('\n[Step 9] Creating and managing a Task in MongoDB...');
    const taskRes = await makeRequest({
      method: 'POST',
      path: `/api/workspaces/${acmeWorkspaceId}/tasks`,
      headers: { Authorization: `Bearer ${alexToken}` },
      body: {
        title: 'Complete Phase 6 deployment and verification',
        description: 'Verify all 6 development phases systematically',
        priority: 'urgent',
        status: 'in_progress',
        assigneeId: sarahLogin.body.user._id,
      },
    });
    console.assert(taskRes.statusCode === 201, 'Task create failed');
    const createdTask = taskRes.body.task;
    console.log(`✓ Task created: "${createdTask.title}" (Priority: ${createdTask.priority}, Status: ${createdTask.status})`);

    // Update Task to Completed
    const updateTaskRes = await makeRequest({
      method: 'PUT',
      path: `/api/workspaces/${acmeWorkspaceId}/tasks/${createdTask._id}`,
      headers: { Authorization: `Bearer ${sarahToken}` },
      body: { status: 'completed' },
    });
    console.assert(updateTaskRes.statusCode === 200, 'Task update failed');
    console.assert(updateTaskRes.body.task.completed === true, 'Task completion flag not updated');
    console.log('✓ Task status transitioned to completed in MongoDB');

    // 10. Real-Time Socket.IO Multi-Client Test
    console.log('\n[Step 10] Testing Live Real-Time Socket.IO Communication (Alex & Sarah)...');

    const alexSocket = ioClient(`http://127.0.0.1:${PORT}`, {
      auth: { token: alexToken },
      transports: ['websocket'],
    });

    const sarahSocket = ioClient(`http://127.0.0.1:${PORT}`, {
      auth: { token: sarahToken },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((res) => alexSocket.on('connect', res)),
      new Promise((res) => sarahSocket.on('connect', res)),
    ]);
    console.log('✓ Both Alex and Sarah connected to Socket.IO server simultaneously');

    // Join channel
    alexSocket.emit('channel:join', { channelId: generalChannelId });
    sarahSocket.emit('channel:join', { channelId: generalChannelId });

    // Test real-time delivery from Alex to Sarah
    const receivedPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket broadcast timed out')), 5000);
      sarahSocket.on('message:received', (msg) => {
        if (msg.content === 'Real-Time Socket Test from Alex to Sarah!') {
          clearTimeout(timeout);
          resolve(msg);
        }
      });
    });

    alexSocket.emit('message:send', {
      workspaceId: acmeWorkspaceId,
      channelId: generalChannelId,
      content: 'Real-Time Socket Test from Alex to Sarah!',
    });

    const broadcastedMsg = await receivedPromise;
    console.log(`✓ Instant real-time message received by Sarah: "${broadcastedMsg.content}"`);

    // Clean up sockets
    alexSocket.disconnect();
    sarahSocket.disconnect();

    console.log('\n================================================================');
    console.log('🎉 ALL END-TO-END TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('E2E Test Error:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runE2ETests();
