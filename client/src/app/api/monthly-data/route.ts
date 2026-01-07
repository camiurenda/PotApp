import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import { MonthlyData, User } from '@/lib/db/models'
import { getAuthUser } from '@/lib/auth'

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

    // Get both users' data for the month
    const users = await User.find({}, { password: 0 })
    const monthlyData = await MonthlyData.find({ year, month })

    const result = users.map((u) => {
      const data = monthlyData.find((d) => d.userId.toString() === u._id.toString())
      return {
        userId: u._id.toString(),
        userName: u.name,
        year,
        month,
        totalIncome: data?.totalIncome || 0,
        fixedPersonalExpenses: data?.fixedPersonalExpenses || 0,
        netAvailable: data?.netAvailable || 0,
      }
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Get monthly data error:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { year, month, totalIncome, fixedPersonalExpenses } = await request.json()

    if (!year || !month) {
      return NextResponse.json({ error: 'Año y mes son requeridos' }, { status: 400 })
    }

    await connectDB()

    const monthlyData = await MonthlyData.findOneAndUpdate(
      { userId: user.id, year, month },
      {
        userId: user.id,
        year,
        month,
        totalIncome: totalIncome || 0,
        fixedPersonalExpenses: fixedPersonalExpenses || 0,
        netAvailable: (totalIncome || 0) - (fixedPersonalExpenses || 0),
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, data: monthlyData })
  } catch (error) {
    console.error('Save monthly data error:', error)
    return NextResponse.json({ error: 'Error al guardar datos' }, { status: 500 })
  }
}
