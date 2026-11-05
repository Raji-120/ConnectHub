import mongoose from 'mongoose';
import crypto from 'crypto';

const WorkspaceMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const WorkspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a workspace name'],
      trim: true,
      maxlength: [50, 'Workspace name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    avatar: {
      type: String,
      default: function () {
        return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
          this.name || 'Workspace'
        )}`;
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [WorkspaceMemberSchema],
    inviteCode: {
      type: String,
      unique: true,
      default: function () {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
      },
    },
  },
  {
    timestamps: true,
  }
);

WorkspaceSchema.index({ 'members.user': 1 });

export const Workspace = mongoose.model('Workspace', WorkspaceSchema);
export default Workspace;
