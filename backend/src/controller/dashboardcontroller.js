import Project from '../models/Project.js';
import Task from '../models/Task.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();

    const completedTasks = await Task.countDocuments({ status: 'Done' });
    const pendingTasks = await Task.countDocuments({ status: 'Todo' });

    res.json({
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};