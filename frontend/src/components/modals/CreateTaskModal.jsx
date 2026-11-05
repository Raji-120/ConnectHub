import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { X, CheckSquare, Calendar, User, Flag, Loader2 } from 'lucide-react';
import Avatar from '../common/Avatar';

export const CreateTaskModal = ({ isOpen, onClose, onCreateTask }) => {
  const { currentWorkspace } = useWorkspace();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError('');

    const res = await onCreateTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
    });

    setLoading(false);

    if (res?.success) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setAssigneeId('');
      setDueDate('');
      onClose();
    } else {
      setError(res?.error || 'Failed to create task');
    }
  };

  const members = currentWorkspace?.members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span>Create Workspace Task</span>
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
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Socket.IO typing indicators"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add acceptance criteria or details..."
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs font-medium text-gray-200 outline-none focus:border-brand-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
                Column Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs font-medium text-gray-200 outline-none focus:border-brand-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs font-medium text-gray-200 outline-none focus:border-brand-500 truncate"
              >
                <option value="">Unassigned</option>
                {members.map((m) => {
                  const u = m.user;
                  if (!u) return null;
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 outline-none focus:border-brand-500"
              />
            </div>
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
              disabled={loading || !title}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Task</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
