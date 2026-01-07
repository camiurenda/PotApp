import { Router } from 'express';
import SavingsGoal from '../models/SavingsGoal';
import { authMiddleware, AuthRequest } from '../utils/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const goals = await SavingsGoal.find({ isCompleted: false }).sort({ currentTargetDate: 1 });

    res.json({
      goals: goals.map((g) => ({
        id: g._id.toString(),
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        originalTargetDate: g.originalTargetDate,
        currentTargetDate: g.currentTargetDate,
        monthlyContributionTarget: g.monthlyContributionTarget,
        isCompleted: g.isCompleted,
        progress: Math.round((g.currentAmount / g.targetAmount) * 100),
      })),
    });
  } catch (error) {
    console.error('Get savings error:', error);
    res.status(500).json({ error: 'Error al obtener metas' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, targetAmount, targetDate } = req.body;

    if (!name || !targetAmount || !targetDate) {
      return res.status(400).json({ error: 'Nombre, monto objetivo y fecha son requeridos' });
    }

    const goal = await SavingsGoal.create({
      name,
      targetAmount,
      currentAmount: 0,
      originalTargetDate: new Date(targetDate),
      currentTargetDate: new Date(targetDate),
      contributions: [],
    });

    res.json({ success: true, goal });
  } catch (error) {
    console.error('Create savings goal error:', error);
    res.status(500).json({ error: 'Error al crear meta' });
  }
});

router.post('/:id/contribute', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, userId } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: 'Monto y usuario son requeridos' });
    }

    const goal = await SavingsGoal.findById(id);
    if (!goal) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    goal.contributions.push({
      date: new Date(),
      amount,
      userId,
    });

    goal.currentAmount += amount;
    await goal.save();

    res.json({ success: true, goal });
  } catch (error) {
    console.error('Contribute to savings error:', error);
    res.status(500).json({ error: 'Error al contribuir a la meta' });
  }
});

export default router;
