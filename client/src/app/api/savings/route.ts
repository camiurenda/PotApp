import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import { SavingsGoal } from '@/lib/db/models'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    await connectDB()

    const goals = await SavingsGoal.find({ isCompleted: false }).sort({ currentTargetDate: 1 })

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Get savings error:', error)
    return NextResponse.json({ error: 'Error al obtener metas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { name, targetAmount, targetDate } = await request.json()

    if (!name || !targetAmount || !targetDate) {
      return NextResponse.json(
        { error: 'Nombre, monto objetivo y fecha son requeridos' },
        { status: 400 }
      )
    }

    await connectDB()

    const goal = await SavingsGoal.create({
      name,
      targetAmount,
      currentAmount: 0,
      originalTargetDate: new Date(targetDate),
      currentTargetDate: new Date(targetDate),
      contributions: [],
    })

    return NextResponse.json({ success: true, goal })
  } catch (error) {
    console.error('Create savings goal error:', error)
    return NextResponse.json({ error: 'Error al crear meta' }, { status: 500 })
  }
}
