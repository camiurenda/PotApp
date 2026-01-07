import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import { SharedExpense } from '@/lib/db/models'
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

    const expenses = await SharedExpense.find({ year, month })
      .populate('paidByUserId', 'name')
      .populate('beneficiaryUserId', 'name')
      .sort({ date: -1 })

    return NextResponse.json({ 
      expenses: expenses.map(e => ({
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
      }))
    })
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { description, amount, category, paidByUserId, splitType, beneficiaryUserId, date } = await request.json()

    if (!description || !amount || !paidByUserId) {
      return NextResponse.json(
        { error: 'Descripción, monto y pagador son requeridos' },
        { status: 400 }
      )
    }

    if (splitType === 'paid_for_other' && !beneficiaryUserId) {
      return NextResponse.json(
        { error: 'Debe especificar el beneficiario para gastos pagados por otra persona' },
        { status: 400 }
      )
    }

    const expenseDate = date ? new Date(date) : new Date()

    await connectDB()

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
    })

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    await connectDB()
    await SharedExpense.findByIdAndDelete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 })
  }
}
