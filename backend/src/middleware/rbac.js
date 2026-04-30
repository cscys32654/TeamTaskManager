export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient role' });
  }
  next();
};

export const requireOwnerOrAdmin = (req, res, next) => {
  const isAdmin = req.user?.role === 'admin';

  if (!isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};