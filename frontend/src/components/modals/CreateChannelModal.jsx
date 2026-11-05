import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { X, Hash, Lock, Loader2 } from 'lucide-react';

export const CreateChannelModal = ({ isOpen, onClose }) => {
  const { createChannel, currentWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    // Sanitize into channel slug: lowercase letters, numbers, hyphens
    const val = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');
    setName(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a channel name');
      return;
    }

    setLoading(true);
    setError('');

    const res = await createChannel({
      name: name.trim(),
      description: description.trim(),
      topic: topic.trim(),
      isPrivate,
    });

    setLoading(false);

    if (res.success) {
      setName('');
      setDescription('');
      setTopic('');
      setIsPrivate(false);
      onClose();
    } else {
      setError(res.error || 'Failed to create channel');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              {isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
            </div>
            <span>Create Channel</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
              Channel Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-bold">
                #
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. project-updates"
                maxLength={30}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Only lowercase letters, numbers, and dashes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
              Topic (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this channel focused on?"
              maxLength={250}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this channel..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition resize-none"
            />
          </div>

          {/* Private Toggle */}
          <div className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-brand-400 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-white block">Make channel private</span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  When private, only invited members can join or view messages.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                isPrivate ? 'bg-brand-600' : 'bg-gray-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isPrivate ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Channel</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
