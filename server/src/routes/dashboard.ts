import { Router } from 'express';
import User from '../models/User';
import MonthlyData from '../models/MonthlyData';
import SharedExpense from '../models/SharedExpense';
import SavingsGoal from '../models/SavingsGoal';
import { authMiddleware, AuthRequest } from '../utils/auth';
import {
  calculateParticipation,
  calculateProportionalDebt,
  recalculateSavingsGoal,
  UserMonthlyFinances,
  SharedExpenseItem,
} from '../utils/equityCalculator';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

    const users = await User.find({}, { password: 0 });
    if (users.length < 2) {
      return res.status(400).json({
        error: 'Se necesitan 2 usuarios. Ejecuta POST /api/seed primero.',
      });
    }

    const monthlyDataRecords = await MonthlyData.find({ year, month });

    const user1Data = monthlyDataRecords.find((d) => d.userId.toString() === users[0]._id.toString());
    const user2Data = monthlyDataRecords.find((d) => d.userId.toString() === users[1]._id.toString());

    const user1Finances: UserMonthlyFinances = {
      userId: users[0]._id.toString(),
      userName: users[0].name,
      totalIncome: user1Data?.totalIncome || 0,
      fixedPersonalExpenses: user1Data?.fixedPersonalExpenses || 0,
      netAvailable: user1Data?.netAvailable || 0,
    };

    const user2Finances: UserMonthlyFinances = {
      userId: users[1]._id.toString(),
      userName: users[1].name,
      totalIncome: user2Data?.totalIncome || 0,
      fixedPersonalExpenses: user2Data?.fixedPersonalExpenses || 0,
      netAvailable: user2Data?.netAvailable || 0,
    };

    const participation = calculateParticipation(user1Finances, user2Finances);

    const expenseRecords = await SharedExpense.find({ year, month });
    const expenses: SharedExpenseItem[] = expenseRecords.map((e) => ({
      id: e._id.toString(),
      description: e.description,
      amount: e.amount,
      paidByUserId: e.paidByUserId.toString(),
      splitType: e.splitType || 'shared',
      beneficiaryUserId: e.beneficiaryUserId?.toString(),
      category: e.category,
      date: e.date,
    }));

    const debtResult = calculateProportionalDebt(participation, expenses);

    const savingsGoals = await SavingsGoal.find({ isCompleted: false });
    const totalNetAvailable = participation.totalNetAvailable;
    const availableForSavings = Math.max(0, totalNetAvailable - debtResult.totalSharedExpenses);

    const savingsRecalculations = savingsGoals.map((goal) =>
      recalculateSavingsGoal(
        {
          id: goal._id.toString(),
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          originalTargetDate: goal.originalTargetDate,
          currentTargetDate: goal.currentTargetDate,
        },
        savingsGoals.length > 0 ? availableForSavings / savingsGoals.length : 0,
        participation
      )
    );

    res.json({
      currentUser: req.user,
      users: users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email })),
      period: { year, month },
      finances: {
        user1: user1Finances,
        user2: user2Finances,
      },
      participation,
      expenses: {
        items: expenses,
        total: debtResult.totalSharedExpenses,
      },
      debt: debtResult,
      savings: savingsRecalculations,
      summary: {
        whoOwesWhom: debtResult.settlement
          ? `${debtResult.settlement.debtorUserName} debe $${debtResult.settlement.amount.toLocaleString()} a ${debtResult.settlement.creditorUserName}`
          : 'Están a mano 🎉',
        user1Percentage: participation.user1.participationPercentage,
        user2Percentage: participation.user2.participationPercentage,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
});

export default router;
