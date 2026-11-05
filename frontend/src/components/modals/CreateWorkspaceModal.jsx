import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { X, Building, Loader2, Sparkles } from 'lucide-react';

export const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a workspace name');
      return;
    }

    setLoading(true);
    setError('');

    const res = await createWorkspace({
      name: name.trim(),
      description: description.trim(),
    });

    setLoading(false);

    if (res.success) {
      setName('');
      setDescription('');
      onClose();
    } else {
      setError(res.error || 'Failed to create workspace');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <Building className="w-4 h-4" />
            </div>
            <span>Create a Workspace</span>
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
              Workspace Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp, Engineering Hub"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              The name of your company, project, or organization.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace about?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition resize-none"
            />
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
                <span>Create Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
