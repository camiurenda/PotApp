import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import { User, MonthlyData, SharedExpense, SavingsGoal } from '@/lib/db/models'
import { getAuthUser } from '@/lib/auth'
import {
  calculateParticipation,
  calculateProportionalDebt,
  recalculateSavingsGoal,
  type UserMonthlyFinances,
  type SharedExpenseItem,
} from '@/lib/calculations/equityCalculator'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    await connectDB()

    // Get users
    const users = await User.find({}, { password: 0 })
    if (users.length < 2) {
      return NextResponse.json({
        error: 'Se necesitan 2 usuarios. Ejecuta POST /api/seed primero.',
      }, { status: 400 })
    }

    // Get monthly data for both users
    const monthlyDataRecords = await MonthlyData.find({ year, month })

    const user1Data = monthlyDataRecords.find(
      (d) => d.userId.toString() === users[0]._id.toString()
    )
    const user2Data = monthlyDataRecords.find(
      (d) => d.userId.toString() === users[1]._id.toString()
    )

    const user1Finances: UserMonthlyFinances = {
      userId: users[0]._id.toString(),
      userName: users[0].name,
      totalIncome: user1Data?.totalIncome || 0,
      fixedPersonalExpenses: user1Data?.fixedPersonalExpenses || 0,
      netAvailable: user1Data?.netAvailable || 0,
    }

    const user2Finances: UserMonthlyFinances = {
      userId: users[1]._id.toString(),
      userName: users[1].name,
      totalIncome: user2Data?.totalIncome || 0,
      fixedPersonalExpenses: user2Data?.fixedPersonalExpenses || 0,
      netAvailable: user2Data?.netAvailable || 0,
    }

    // Calculate participation
    const participation = calculateParticipation(user1Finances, user2Finances)

    // Get shared expenses
    const expenseRecords = await SharedExpense.find({ year, month })
    const expenses: SharedExpenseItem[] = expenseRecords.map((e) => ({
      id: e._id.toString(),
      description: e.description,
      amount: e.amount,
      paidByUserId: e.paidByUserId.toString(),
      splitType: e.splitType || 'shared',
      beneficiaryUserId: e.beneficiaryUserId?.toString(),
      category: e.category,
      date: e.date,
    }))

    // Calculate debt
    const debtResult = calculateProportionalDebt(participation, expenses)

    // Get savings goals
    const savingsGoals = await SavingsGoal.find({ isCompleted: false })
    const totalNetAvailable = participation.totalNetAvailable
    const availableForSavings = Math.max(0, totalNetAvailable - debtResult.totalSharedExpenses)

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
    )

    return NextResponse.json({
      currentUser: user,
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
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Error al cargar dashboard' }, { status: 500 })
  }
}
