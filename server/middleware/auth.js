import { logger } from '../utils/logger.js';

export function authMiddleware(req, res, next) {
  // Mock authentication - in production, this would validate JWT tokens
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = req.headers['x-user-id'];
  
  if (!token || !userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Mock user data - in production, this would come from token validation
  req.user = {
    id: userId,
    role: userId === 'reliefAdmin' ? 'admin' : 'contributor'
  };

  logger.debug(`Authenticated user: ${userId} with role: ${req.user.role}`);
  next();
}