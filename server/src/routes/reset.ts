import { Router } from 'express';
import User from '../models/User';
import MonthlyData from '../models/MonthlyData';
import SharedExpense from '../models/SharedExpense';
import SavingsGoal from '../models/SavingsGoal';

const router = Router();

router.post('/', async (req, res) => {
  try {
    await Promise.all([
      User.deleteMany({}),
      MonthlyData.deleteMany({}),
      SharedExpense.deleteMany({}),
      SavingsGoal.deleteMany({}),
    ]);

    res.json({
      success: true,
      message: 'Base de datos limpiada exitosamente',
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Error al limpiar la base de datos' });
  }
});

export default router;
