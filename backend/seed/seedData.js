import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedUsers = [
  {
    name: 'Alex Turner',
    email: 'alex@connecthub.io',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    customStatus: 'Building ConnectHub 🚀',
    bio: 'Lead Engineer & Platform Architect. Passionate about real-time distributed collaboration systems.',
  },
  {
    name: 'Sarah Connor',
    email: 'sarah@connecthub.io',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    customStatus: 'Reviewing pull requests 👀',
    bio: 'Full Stack Engineer & Security Specialist. Ensuring zero vulnerabilities across our infrastructure.',
  },
  {
    name: 'David Kim',
    email: 'david@connecthub.io',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'away',
    customStatus: 'Design sprint in progress 🎨',
    bio: 'UI/UX Designer & Frontend Advocate. Obsessed with micro-interactions, dark mode aesthetics, and clean typography.',
  },
];

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connecthub';
    console.log(`[Seed] Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Seeding Users...');
    const userDocs = {};
    for (const userData of seedUsers) {
      let existing = await User.findOne({ email: userData.email });
      if (!existing) {
        existing = await User.create(userData);
        console.log(`  ✓ Created user: ${userData.name} (${userData.email})`);
      } else {
        console.log(`  - User already exists: ${userData.email}`);
      }
      userDocs[userData.email] = existing;
    }

    const alex = userDocs['alex@connecthub.io'];
    const sarah = userDocs['sarah@connecthub.io'];
    const david = userDocs['david@connecthub.io'];

    console.log('\n[Seed] Seeding Workspaces...');
    let acme = await Workspace.findOne({ name: 'Acme Corp' });
    if (!acme) {
      acme = await Workspace.create({
        name: 'Acme Corp',
        description: 'Global headquarters for Acme engineering & product teams',
        owner: alex._id,
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        members: [
          { user: alex._id, role: 'owner', joinedAt: new Date() },
          { user: sarah._id, role: 'admin', joinedAt: new Date() },
          { user: david._id, role: 'member', joinedAt: new Date() },
        ],
      });
      console.log(`  ✓ Created workspace: Acme Corp (Code: ${acme.inviteCode})`);
    } else {
      console.log(`  - Workspace already exists: Acme Corp`);
    }

    let tech = await Workspace.findOne({ name: 'Tech Innovators' });
    if (!tech) {
      tech = await Workspace.create({
        name: 'Tech Innovators',
        description: 'Next-generation incubator and product lab',
        owner: sarah._id,
        avatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=80',
        members: [
          { user: sarah._id, role: 'owner', joinedAt: new Date() },
          { user: alex._id, role: 'admin', joinedAt: new Date() },
        ],
      });
      console.log(`  ✓ Created workspace: Tech Innovators (Code: ${tech.inviteCode})`);
    } else {
      console.log(`  - Workspace already exists: Tech Innovators`);
    }

    console.log('\n[Seed] Seeding Channels...');
    const acmeChannelsData = [
      {
        name: 'general',
        description: 'General discussions for the entire Acme Corp team',
        topic: 'Welcome to Acme Corp! Check pinned messages for team guidelines.',
        workspace: acme._id,
        isPrivate: false,
        createdBy: alex._id,
        members: [alex._id, sarah._id, david._id],
      },
      {
        name: 'development',
        description: 'Engineering discussions, architecture RFCs, and code review notices',
        topic: 'Sprint 24: Core Real-Time Messaging & Cloudinary sync',
        workspace: acme._id,
        isPrivate: false,
        createdBy: alex._id,
        members: [alex._id, sarah._id, david._id],
      },
      {
        name: 'random',
        description: 'Memes, music, off-topic chat, and weekend plans',
        topic: 'Watercooler chats & Friday trivia',
        workspace: acme._id,
        isPrivate: false,
        createdBy: david._id,
        members: [alex._id, sarah._id, david._id],
      },
      {
        name: 'leadership',
        description: 'Confidential executive and management discussions',
        topic: 'Q3 Strategy & Hiring plans',
        workspace: acme._id,
        isPrivate: true,
        createdBy: alex._id,
        members: [alex._id, sarah._id],
      },
    ];

    const channelDocs = {};
    for (const ch of acmeChannelsData) {
      let doc = await Channel.findOne({ workspace: acme._id, name: ch.name });
      if (!doc) {
        doc = await Channel.create(ch);
        console.log(`  ✓ Created channel: #${ch.name}`);
      }
      channelDocs[ch.name] = doc;
    }

    const generalChannel = channelDocs['general'];
    const devChannel = channelDocs['development'];

    console.log('\n[Seed] Seeding Conversations & Messages...');
    // Direct Conversation between Alex and Sarah
    let directConv = await Conversation.findOne({
      workspace: acme._id,
      isGroup: false,
      participants: { $all: [alex._id, sarah._id] },
    });

    if (!directConv) {
      directConv = await Conversation.create({
        workspace: acme._id,
        participants: [alex._id, sarah._id],
        isGroup: false,
      });
      console.log('  ✓ Created direct conversation: Alex <-> Sarah');
    }

    // Seed Messages in #general if empty
    const generalMsgCount = await Message.countDocuments({ channel: generalChannel._id });
    if (generalMsgCount === 0) {
      const m1 = await Message.create({
        sender: alex._id,
        workspace: acme._id,
        channel: generalChannel._id,
        content: '👋 Welcome to ConnectHub! This is our real-time collaboration hub connected to MongoDB with live Socket.IO delivery.',
        isPinned: true,
        pinnedBy: alex._id,
        pinnedAt: new Date(),
        reactions: [{ user: sarah._id, emoji: '🚀' }, { user: david._id, emoji: '🔥' }],
        readBy: [{ user: alex._id, readAt: new Date() }, { user: sarah._id, readAt: new Date() }],
      });

      const m2 = await Message.create({
        sender: sarah._id,
        workspace: acme._id,
        channel: generalChannel._id,
        content: 'Glad to be here! The real-time messaging, typing indicators, and file upload capabilities look fantastic. ✨',
        reactions: [{ user: alex._id, emoji: '❤️' }, { user: david._id, emoji: '💯' }],
        readBy: [{ user: sarah._id, readAt: new Date() }, { user: alex._id, readAt: new Date() }],
      });

      const m3 = await Message.create({
        sender: david._id,
        workspace: acme._id,
        channel: generalChannel._id,
        content: 'Check out the new Task Board under the workspace menu — Kanban drag & drop with priorities is live! 📋',
        reactions: [{ user: alex._id, emoji: '👏' }],
        readBy: [{ user: david._id, readAt: new Date() }],
      });

      console.log('  ✓ Seeded messages in #general');
    }

    // Seed DM messages if empty
    const dmMsgCount = await Message.countDocuments({ conversation: directConv._id });
    if (dmMsgCount === 0) {
      const d1 = await Message.create({
        sender: alex._id,
        workspace: acme._id,
        conversation: directConv._id,
        content: 'Hey Sarah! Can you review the Cloudinary upload middleware PR when you have a moment?',
        readBy: [{ user: alex._id, readAt: new Date() }, { user: sarah._id, readAt: new Date() }],
      });

      const d2 = await Message.create({
        sender: sarah._id,
        workspace: acme._id,
        conversation: directConv._id,
        content: 'Sure Alex, reviewing right now! Everything looks solid, auth cookies and JWT session verification are working seamlessly.',
        readBy: [{ user: sarah._id, readAt: new Date() }, { user: alex._id, readAt: new Date() }],
      });

      await Conversation.findByIdAndUpdate(directConv._id, {
        lastMessage: d2._id,
        lastMessageAt: new Date(),
      });
      console.log('  ✓ Seeded DM messages between Alex and Sarah');
    }

    console.log('\n[Seed] Seeding Tasks...');
    const taskCount = await Task.countDocuments({ workspace: acme._id });
    if (taskCount === 0) {
      await Task.insertMany([
        {
          workspace: acme._id,
          creator: alex._id,
          assignee: sarah._id,
          title: 'Verify Cloudinary storage and fallback local uploader',
          description: 'Ensure uploaded images and documents render with uploader metadata and size badges.',
          priority: 'urgent',
          status: 'in_progress',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          completed: false,
        },
        {
          workspace: acme._id,
          creator: alex._id,
          assignee: david._id,
          title: 'Design Kanban task board layout in dark theme',
          description: 'Create column views for To Do, In Progress, In Review, and Completed with priority styling.',
          priority: 'high',
          status: 'completed',
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          completed: true,
          completedAt: new Date(),
        },
        {
          workspace: acme._id,
          creator: sarah._id,
          assignee: alex._id,
          title: 'Multi-window real-time synchronization test',
          description: 'Test typing indicators, online presence, and instant message reflection between two active windows.',
          priority: 'medium',
          status: 'todo',
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          completed: false,
        },
        {
          workspace: acme._id,
          creator: david._id,
          assignee: sarah._id,
          title: 'Security audit for workspace and channel permissions',
          description: 'Validate role-based permissions so non-members cannot read private channel messages.',
          priority: 'high',
          status: 'review',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          completed: false,
        },
      ]);
      console.log('  ✓ Seeded 4 workspace tasks');
    }

    console.log('\n======================================================');
    console.log('🎉 CONNECTHUB DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
    console.log('Demo Credentials:');
    console.log('1. Alex Turner:   alex@connecthub.io  | Password: Password123!');
    console.log('2. Sarah Connor:  sarah@connecthub.io | Password: Password123!');
    console.log('3. David Kim:     david@connecthub.io | Password: Password123!\n');

    if (process.argv[1] === fileURLToPath(import.meta.url)) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]:', error);
    if (process.argv[1] === fileURLToPath(import.meta.url)) {
      process.exit(1);
    }
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}
