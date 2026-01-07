import { Router } from 'express';
import User from '../models/User';
import { hashPassword, verifyPassword, generateToken, authMiddleware, AuthRequest } from '../utils/auth';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });

    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/logout', (req, res) => {
  res.cookie('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  res.json({ success: true });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
