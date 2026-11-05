import Workspace from '../models/Workspace.js';

export const checkWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId =
      req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID is required',
      });
    }

    const workspace = await Workspace.findById(workspaceId).populate(
      'members.user',
      'name email avatar status customStatus'
    );

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const memberEntry = workspace.members.find(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!memberEntry) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace',
      });
    }

    req.workspace = workspace;
    req.userRole = memberEntry.role;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles = ['owner', 'admin']) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Action forbidden. Requires one of roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};
