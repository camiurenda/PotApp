import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies['auth-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  req.user = user;
  next();
}
