import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, UserRole } from '../models/user.model';
import { ApiError } from '../utils/apiError';

interface JwtPayload {
  id: string;
  role: UserRole;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Read from HTTP-Only cookie (primary)
    if (req.cookies && req.cookies[config.cookieName]) {
      token = req.cookies[config.cookieName];
    }
    // 2. Fallback to Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required. Please log in.', 'AUTH_REQUIRED');
    }

    // Verify JWT
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired authentication session.', 'INVALID_TOKEN');
    }

    // Fetch user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('The user belonging to this session no longer exists.', 'USER_NOT_FOUND');
    }

    if (user.isActive === false) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact platform support.', 'ACCOUNT_DEACTIVATED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies[config.cookieName]) {
      token = req.cookies[config.cookieName];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore token errors for optional authentication
    }

    next();
  } catch {
    next();
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.', 'AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          'You do not have permission to access this resource.',
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

