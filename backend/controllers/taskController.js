import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

// @desc    Create a task
// @route   POST /api/workspaces/:workspaceId/tasks
// @access  Private (Member)
export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assigneeId, status } = req.body;
    const workspaceId = req.params.workspaceId;
    const currentUserId = req.user._id;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    const task = await Task.create({
      workspace: workspaceId,
      creator: currentUserId,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
      status: ['todo', 'in_progress', 'review', 'completed'].includes(status) ? status : 'todo',
      dueDate: dueDate ? new Date(dueDate) : null,
      assignee: assigneeId || null,
      completed: status === 'completed',
      completedAt: status === 'completed' ? new Date() : null,
    });

    // Notify assignee if assigned to someone else
    if (assigneeId && assigneeId.toString() !== currentUserId.toString()) {
      await Notification.create({
        recipient: assigneeId,
        sender: currentUserId,
        workspace: workspaceId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you the task: "${title.trim()}"`,
        link: `/dashboard/tasks`,
      });
    }

    const populated = await Task.findById(task._id)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar status');

    res.status(201).json({
      success: true,
      task: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workspace tasks
// @route   GET /api/workspaces/:workspaceId/tasks
// @access  Private (Member)
export const getWorkspaceTasks = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;
    const { status, priority, assignee } = req.query;

    const filter = { workspace: workspaceId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task (status, title, assignee, priority, dueDate)
// @route   PUT /api/workspaces/:workspaceId/tasks/:taskId
// @access  Private (Member)
export const updateTask = async (req, res, next) => {
  try {
    const { taskId, workspaceId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId, completed } = req.body;

    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in this workspace',
      });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) task.assignee = assigneeId || null;

    if (status !== undefined) {
      task.status = status;
      if (status === 'completed') {
        task.completed = true;
        task.completedAt = new Date();
      } else {
        task.completed = false;
        task.completedAt = null;
      }
    }

    if (completed !== undefined) {
      task.completed = completed;
      task.completedAt = completed ? new Date() : null;
      if (completed && task.status !== 'completed') {
        task.status = 'completed';
      } else if (!completed && task.status === 'completed') {
        task.status = 'in_progress';
      }
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar status');

    res.status(200).json({
      success: true,
      task: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/workspaces/:workspaceId/tasks/:taskId
// @access  Private (Creator or Owner/Admin)
export const deleteTask = async (req, res, next) => {
  try {
    const { taskId, workspaceId } = req.params;
    const currentUserId = req.user._id;

    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in this workspace',
      });
    }

    const isCreator = task.creator.toString() === currentUserId.toString();
    const isPrivileged = req.userRole === 'owner' || req.userRole === 'admin';

    if (!isCreator && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task',
      });
    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
