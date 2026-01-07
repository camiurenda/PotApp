import { Router } from 'express';
import User from '../models/User';
import { hashPassword } from '../utils/auth';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers >= 2) {
      const users = await User.find({}, { password: 0 });
      return res.json({
        message: 'Los usuarios ya existen',
        users,
      });
    }

    const password1 = await hashPassword(process.env.USER1_PASSWORD || 'password1');
    const password2 = await hashPassword(process.env.USER2_PASSWORD || 'password2');

    const user1Name = process.env.USER1_NAME || 'Usuario 1';
    const user2Name = process.env.USER2_NAME || 'Usuario 2';

    const users = await User.create([
      {
        name: user1Name,
        email: `${user1Name.toLowerCase().replace(/\s+/g, '')}@potapp.com`,
        password: password1,
      },
      {
        name: user2Name,
        email: `${user2Name.toLowerCase().replace(/\s+/g, '')}@potapp.com`,
        password: password2,
      },
    ]);

    res.json({
      success: true,
      message: 'Usuarios creados exitosamente',
      users: users.map((u) => ({ id: u._id, name: u.name, email: u.email })),
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Error al crear usuarios' });
  }
});

export default router;
