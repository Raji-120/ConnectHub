import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import CreateTaskModal from '../modals/CreateTaskModal';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { id: 'review', title: 'In Review', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { id: 'completed', title: 'Completed', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
];

const PRIORITY_STYLES = {
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

export const TaskBoard = () => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchTasks = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`/workspaces/${currentWorkspace._id}/tasks`);
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (taskData) => {
    try {
      const res = await axiosClient.post(
        `/workspaces/${currentWorkspace._id}/tasks`,
        taskData
      );
      if (res.data?.success) {
        setTasks((prev) => [res.data.task, ...prev]);
        return { success: true };
      }
      throw new Error(res.data?.message || 'Failed to create task');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? {
                ...t,
                status: newStatus,
                completed: newStatus === 'completed',
              }
            : t
        )
      );

      await axiosClient.put(
        `/workspaces/${currentWorkspace._id}/tasks/${taskId}`,
        { status: newStatus }
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
      fetchTasks();
    }
  };

  const handleToggleComplete = async (taskId, currentCompleted) => {
    try {
      const newCompleted = !currentCompleted;
      const newStatus = newCompleted ? 'completed' : 'in_progress';

      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, completed: newCompleted, status: newStatus }
            : t
        )
      );

      await axiosClient.put(
        `/workspaces/${currentWorkspace._id}/tasks/${taskId}`,
        { completed: newCompleted, status: newStatus }
      );
    } catch (err) {
      console.error('Failed to toggle completion:', err);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      await axiosClient.delete(
        `/workspaces/${currentWorkspace._id}/tasks/${taskId}`
      );
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchTasks();
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-14 px-6 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Workspace Tasks</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                {tasks.length}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-xs text-gray-200 outline-none w-44"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-300 outline-none focus:border-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Create Task Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-5">
        {COLUMNS.map((col, colIdx) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="w-80 shrink-0 flex flex-col bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden max-h-full"
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${col.color}`}
                  >
                    {col.title}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition"
                  title="Add task in this column"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards Column List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task._id}
                      className="p-4 rounded-xl bg-gray-950 border border-gray-800/80 hover:border-gray-700 shadow-sm transition space-y-2.5 group"
                    >
                      {/* Priority and Actions */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${
                            PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                          }`}
                        >
                          {task.priority}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {colIdx > 0 && (
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  task._id,
                                  COLUMNS[colIdx - 1].id
                                )
                              }
                              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
                              title="Move back"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  task._id,
                                  COLUMNS[colIdx + 1].id
                                )
                              }
                              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
                              title="Move next"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Checkbox */}
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() =>
                            handleToggleComplete(task._id, task.completed)
                          }
                          className="mt-0.5 text-gray-400 hover:text-emerald-400 transition"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <h4
                          className={`text-xs font-semibold text-gray-100 leading-snug break-words ${
                            task.completed ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 pl-6.5">
                          {task.description}
                        </p>
                      )}

                      {/* Footer: Due date & Assignee */}
                      <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
                        {task.dueDate ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600">No due date</span>
                        )}

                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar
                              src={task.assignee.avatar}
                              name={task.assignee.name}
                              size="xs"
                              status={task.assignee.status}
                            />
                            <span className="truncate max-w-[80px]">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-[10px]">Unassigned</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
};

export default TaskBoard;
