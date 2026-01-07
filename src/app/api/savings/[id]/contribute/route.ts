import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import { SavingsGoal } from '@/lib/db/models'
import { getAuthUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const { amount, userId } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    await connectDB()

    const goal = await SavingsGoal.findById(id)
    if (!goal) {
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 })
    }

    goal.contributions.push({
      date: new Date(),
      amount,
      userId: userId || user.id,
    })
    goal.currentAmount += amount

    // Recalculate target date if needed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true
    }

    await goal.save()

    return NextResponse.json({ success: true, goal })
  } catch (error) {
    console.error('Contribute to savings error:', error)
    return NextResponse.json({ error: 'Error al aportar' }, { status: 500 })
  }
}
