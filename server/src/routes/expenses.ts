import { Router } from 'express';
import SharedExpense from '../models/SharedExpense';
import { authMiddleware, AuthRequest } from '../utils/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

    const expenses = await SharedExpense.find({ year, month })
      .populate('paidByUserId', 'name')
      .populate('beneficiaryUserId', 'name')
      .sort({ date: -1 });

    res.json({
      expenses: expenses.map((e) => ({
        id: e._id.toString(),
        description: e.description,
        amount: e.amount,
        category: e.category,
        paidByUserId: e.paidByUserId._id?.toString() || e.paidByUserId.toString(),
        paidByUserName: (e.paidByUserId as any).name || 'Usuario',
        splitType: e.splitType,
        beneficiaryUserId: e.beneficiaryUserId?._id?.toString() || e.beneficiaryUserId?.toString(),
        beneficiaryUserName: e.beneficiaryUserId ? ((e.beneficiaryUserId as any).name || 'Usuario') : undefined,
        date: e.date,
        year: e.year,
        month: e.month,
      })),
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { description, amount, category, paidByUserId, splitType, beneficiaryUserId, date } = req.body;

    if (!description || !amount || !paidByUserId) {
      return res.status(400).json({ error: 'Descripción, monto y pagador son requeridos' });
    }

    if (splitType === 'paid_for_other' && !beneficiaryUserId) {
      return res.status(400).json({ error: 'Debe especificar el beneficiario para gastos pagados por otra persona' });
    }

    const expenseDate = date ? new Date(date) : new Date();

    const expense = await SharedExpense.create({
      description,
      amount,
      category: category || 'otros',
      paidByUserId,
      splitType: splitType || 'shared',
      beneficiaryUserId: splitType === 'paid_for_other' ? beneficiaryUserId : undefined,
      date: expenseDate,
      year: expenseDate.getFullYear(),
      month: expenseDate.getMonth() + 1,
    });

    res.json({ success: true, expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Error al crear gasto' });
  }
});

router.delete('/', async (req: AuthRequest, res) => {
  try {
    const id = req.query.id as string;

    if (!id) {
      return res.status(400).json({ error: 'ID es requerido' });
    }

    await SharedExpense.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});

export default router;
