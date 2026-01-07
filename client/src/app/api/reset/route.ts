import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import { User, MonthlyData, SharedExpense, SavingsGoal } from '@/lib/db/models'

export async function POST() {
  try {
    await connectDB()

    // Delete all data
    await Promise.all([
      User.deleteMany({}),
      MonthlyData.deleteMany({}),
      SharedExpense.deleteMany({}),
      SavingsGoal.deleteMany({})
    ])

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada exitosamente'
    })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json(
      { error: 'Error al limpiar la base de datos' },
      { status: 500 }
    )
  }
}
