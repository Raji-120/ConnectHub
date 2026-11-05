import mongoose from 'mongoose';

const ChannelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a channel name'],
      trim: true,
      lowercase: true,
      maxlength: [30, 'Channel name cannot exceed 30 characters'],
      match: [
        /^[a-z0-9_-]+$/,
        'Channel name can only contain lowercase letters, numbers, hyphens, and underscores',
      ],
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    topic: {
      type: String,
      default: '',
      maxlength: [250, 'Topic cannot exceed 250 characters'],
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

ChannelSchema.index({ workspace: 1, name: 1 }, { unique: true });

export const Channel = mongoose.model('Channel', ChannelSchema);
export default Channel;
