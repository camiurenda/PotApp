import { Router } from 'express';
import MonthlyData from '../models/MonthlyData';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../utils/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

    const users = await User.find({}, { password: 0 });
    const monthlyData = await MonthlyData.find({ year, month });

    const result = users.map((u) => {
      const data = monthlyData.find((d) => d.userId.toString() === u._id.toString());
      return {
        userId: u._id.toString(),
        userName: u.name,
        year,
        month,
        totalIncome: data?.totalIncome || 0,
        fixedPersonalExpenses: data?.fixedPersonalExpenses || 0,
        netAvailable: data?.netAvailable || 0,
      };
    });

    res.json({ data: result });
  } catch (error) {
    console.error('Get monthly data error:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { year, month, totalIncome, fixedPersonalExpenses } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: 'Año y mes son requeridos' });
    }

    const monthlyData = await MonthlyData.findOneAndUpdate(
      { userId: req.user!.id, year, month },
      {
        userId: req.user!.id,
        year,
        month,
        totalIncome: totalIncome || 0,
        fixedPersonalExpenses: fixedPersonalExpenses || 0,
        netAvailable: (totalIncome || 0) - (fixedPersonalExpenses || 0),
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    console.error('Save monthly data error:', error);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

export default router;
