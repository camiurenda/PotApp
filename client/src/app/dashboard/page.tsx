'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Target,
  Users,
  ArrowRightLeft,
} from 'lucide-react'
import { Card, ProgressBar } from '@/components/ui'

interface DashboardData {
  currentUser: { id: string; name: string; email: string }
  users: Array<{ id: string; name: string; email: string }>
  period: { year: number; month: number }
  finances: {
    user1: {
      userId: string
      userName: string
      totalIncome: number
      fixedPersonalExpenses: number
      netAvailable: number
    }
    user2: {
      userId: string
      userName: string
      totalIncome: number
      fixedPersonalExpenses: number
      netAvailable: number
    }
  }
  participation: {
    user1: { userId: string; userName: string; participationPercentage: number }
    user2: { userId: string; userName: string; participationPercentage: number }
    totalNetAvailable: number
  }
  expenses: {
    items: Array<{
      id: string
      description: string
      amount: number
      category: string
      paidByUserId: string
      paidByUserName: string
      splitType: 'shared' | 'personal' | 'paid_for_other' | 'full_reimbursement'
      beneficiaryUserId?: string
      beneficiaryUserName?: string
      date: string
    }>
    total: number
  }
  debt: {
    totalSharedExpenses: number
    user1ShouldPay: number
    user2ShouldPay: number
    user1ActuallyPaid: number
    user2ActuallyPaid: number
    settlement: {
      debtorUserId: string
      debtorUserName: string
      creditorUserId: string
      creditorUserName: string
      amount: number
    } | null
  }
  savings: Array<{
    goalId: string
    goalName: string
    targetAmount: number
    currentAmount: number
    remaining: number
    originalTargetDate: string
    newTargetDate: string
    monthlyContributionNeeded: number
    user1MonthlyContribution: number
    user2MonthlyContribution: number
    isDelayed: boolean
    monthsDelayed: number
  }>
  summary: {
    whoOwesWhom: string
    user1Percentage: number
    user2Percentage: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showSavingsModal, setShowSavingsModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard?year=${year}&month=${month}`)
      if (res.status === 401) {
        router.push('/')
        return
      }
      const json = await res.json()
      if (json.error) {
        console.error(json.error)
      } else {
        setData(json)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [year, month, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const changeMonth = (delta: number) => {
    let newMonth = month + delta
    let newYear = year

    if (newMonth > 12) {
      newMonth = 1
      newYear++
    } else if (newMonth < 1) {
      newMonth = 12
      newYear--
    }

    setMonth(newMonth)
    setYear(newYear)
    setLoading(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <p className="text-gray-600 mb-4">No se pudieron cargar los datos.</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Volver al inicio
          </button>
        </Card>
      </div>
    )
  }

  const monthName = format(new Date(year, month - 1), 'MMMM yyyy', { locale: es })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">ParejaFinance</h1>
              <p className="text-xs text-gray-500">Hola, {data.currentUser.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Month Selector */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthName}</h2>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Main Balance Card */}
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Balance del Mes</span>
          </div>
          <p className="text-2xl font-bold mb-2">{data.summary.whoOwesWhom}</p>
          <div className="flex items-center gap-4 text-sm opacity-80">
            <span>Total gastos: {formatCurrency(data.debt.totalSharedExpenses)}</span>
          </div>
        </Card>

        {/* Participation Split */}
        <Card title="Participación Proporcional" subtitle="Basado en neto disponible">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-sm text-gray-700">{data.participation.user1.userName}</span>
              </div>
              <span className="font-semibold text-primary-600">
                {data.participation.user1.participationPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-500" />
                <span className="text-sm text-gray-700">{data.participation.user2.userName}</span>
              </div>
              <span className="font-semibold text-accent-600">
                {data.participation.user2.participationPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="bg-primary-500 h-full transition-all duration-500"
                style={{ width: `${data.participation.user1.participationPercentage}%` }}
              />
              <div
                className="bg-accent-500 h-full transition-all duration-500"
                style={{ width: `${data.participation.user2.participationPercentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Finances Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary-500" />
              <span className="text-xs text-gray-500">{data.finances.user1.userName}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(data.finances.user1.netAvailable)}
            </p>
            <p className="text-xs text-gray-500">Neto disponible</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-accent-500" />
              <span className="text-xs text-gray-500">{data.finances.user2.userName}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(data.finances.user2.netAvailable)}
            </p>
            <p className="text-xs text-gray-500">Neto disponible</p>
          </Card>
        </div>

        {/* Debt Breakdown */}
        <Card title="Desglose de Pagos">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{data.participation.user1.userName} debía pagar</span>
              <span className="font-medium">{formatCurrency(data.debt.user1ShouldPay)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{data.participation.user1.userName} pagó</span>
              <span className="font-medium">{formatCurrency(data.debt.user1ActuallyPaid)}</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{data.participation.user2.userName} debía pagar</span>
              <span className="font-medium">{formatCurrency(data.debt.user2ShouldPay)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{data.participation.user2.userName} pagó</span>
              <span className="font-medium">{formatCurrency(data.debt.user2ActuallyPaid)}</span>
            </div>
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card
          title="Gastos Compartidos"
          subtitle={`${data.expenses.items.length} gastos este mes`}
        >
          {data.expenses.items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay gastos registrados</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.expenses.items.slice(0, 5).map((expense) => {
                const getSplitTypeLabel = (splitType: string) => {
                  switch (splitType) {
                    case 'shared': return '50/50'
                    case 'personal': return 'Personal'
                    case 'paid_for_other': return 'A favor de otra'
                    default: return ''
                  }
                }
                
                return (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                      <p className="text-xs text-gray-500">
                        Pagó {expense.paidByUserName}
                        {expense.splitType === 'paid_for_other' && expense.beneficiaryUserName && 
                          ` → ${expense.beneficiaryUserName}`
                        }
                        {' • '}
                        <span className={`font-medium ${
                          expense.splitType === 'shared' ? 'text-primary-600' :
                          expense.splitType === 'personal' ? 'text-gray-600' :
                          'text-accent-600'
                        }`}>
                          {getSplitTypeLabel(expense.splitType)}
                        </span>
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900 ml-2">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Savings Goals */}
        <Card title="Metas de Ahorro">
          {data.savings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay metas de ahorro</p>
          ) : (
            <div className="space-y-4">
              {data.savings.map((goal) => (
                <div key={goal.goalId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-accent-500" />
                      <span className="text-sm font-medium text-gray-900">{goal.goalName}</span>
                    </div>
                    {goal.isDelayed && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        +{goal.monthsDelayed} meses
                      </span>
                    )}
                  </div>
                  <ProgressBar
                    value={goal.currentAmount}
                    max={goal.targetAmount}
                    color="accent"
                    size="md"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}</span>
                    <span>
                      Meta: {format(new Date(goal.newTargetDate), 'MMM yyyy', { locale: es })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Ingresos
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            Gasto
          </button>
          <button
            onClick={() => setShowSavingsModal(true)}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <PiggyBank className="w-4 h-4" />
            Meta
          </button>
        </div>
      </div>

      {/* Modals */}
      {showExpenseModal && (
        <ExpenseModal
          users={data.users}
          year={year}
          month={month}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            setShowExpenseModal(false)
            fetchData()
          }}
        />
      )}

      {showIncomeModal && (
        <IncomeModal
          currentUserId={data.currentUser.id}
          year={year}
          month={month}
          currentData={
            data.finances.user1.userId === data.currentUser.id
              ? data.finances.user1
              : data.finances.user2
          }
          onClose={() => setShowIncomeModal(false)}
          onSuccess={() => {
            setShowIncomeModal(false)
            fetchData()
          }}
        />
      )}

      {showSavingsModal && (
        <SavingsModal
          onClose={() => setShowSavingsModal(false)}
          onSuccess={() => {
            setShowSavingsModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

// Expense Modal Component
function ExpenseModal({
  users,
  year,
  month,
  onClose,
  onSuccess,
}: {
  users: Array<{ id: string; name: string }>
  year: number
  month: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('otros')
  const [paidByUserId, setPaidByUserId] = useState(users[0]?.id || '')
  const [splitType, setSplitType] = useState('shared')
  const [beneficiaryUserId, setBeneficiaryUserId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          category,
          paidByUserId,
          splitType,
          beneficiaryUserId: splitType === 'paid_for_other' ? beneficiaryUserId : undefined,
          date: new Date(year, month - 1, 15),
        }),
      })

      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'alquiler', label: 'Alquiler' },
    { value: 'supermercado', label: 'Supermercado' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'salud', label: 'Salud' },
    { value: 'entretenimiento', label: 'Entretenimiento' },
    { value: 'restaurantes', label: 'Restaurantes' },
    { value: 'otros', label: 'Otros' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Nuevo Gasto</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                placeholder="Ej: Compra supermercado"
                required
              />
            </div>

            <div>
              <label className="label">Monto</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                placeholder="0"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="label">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">¿Quién pagó?</label>
              <select
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                className="input-field"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo de gasto</label>
              <select
                value={splitType}
                onChange={(e) => {
                  setSplitType(e.target.value)
                  if (e.target.value !== 'paid_for_other') {
                    setBeneficiaryUserId('')
                  }
                }}
                className="input-field"
              >
                <option value="shared">Compartido equitativamente (50/50)</option>
                <option value="personal">Gasto personal</option>
                <option value="paid_for_other">Pagado a favor de otra persona</option>
              </select>
            </div>

            {splitType === 'paid_for_other' && (
              <div>
                <label className="label">¿Para quién?</label>
                <select
                  value={beneficiaryUserId}
                  onChange={(e) => setBeneficiaryUserId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {users
                    .filter((user) => user.id !== paidByUserId)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Guardando...' : 'Agregar Gasto'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Income Modal Component
function IncomeModal({
  currentUserId,
  year,
  month,
  currentData,
  onClose,
  onSuccess,
}: {
  currentUserId: string
  year: number
  month: number
  currentData: { totalIncome: number; fixedPersonalExpenses: number }
  onClose: () => void
  onSuccess: () => void
}) {
  const [totalIncome, setTotalIncome] = useState(currentData.totalIncome.toString())
  const [fixedExpenses, setFixedExpenses] = useState(currentData.fixedPersonalExpenses.toString())
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/monthly-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          totalIncome: parseFloat(totalIncome) || 0,
          fixedPersonalExpenses: parseFloat(fixedExpenses) || 0,
        }),
      })

      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving income:', error)
    } finally {
      setLoading(false)
    }
  }

  const netAvailable = (parseFloat(totalIncome) || 0) - (parseFloat(fixedExpenses) || 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Mis Ingresos del Mes</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Ingresos Totales</label>
              <input
                type="number"
                value={totalIncome}
                onChange={(e) => setTotalIncome(e.target.value)}
                className="input-field"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="label">Gastos Fijos Personales</label>
              <p className="text-xs text-gray-500 mb-2">
                Deudas propias, gastos individuales fijos
              </p>
              <input
                type="number"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
                className="input-field"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-sm text-primary-700">Neto Disponible</p>
              <p className="text-2xl font-bold text-primary-600">
                ${netAvailable.toLocaleString()}
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Savings Modal Component
function SavingsModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetAmount: parseFloat(targetAmount),
          targetDate,
        }),
      })

      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating savings goal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Nueva Meta de Ahorro</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre de la Meta</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Ej: Vacaciones, Fondo de emergencia"
                required
              />
            </div>

            <div>
              <label className="label">Monto Objetivo</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="input-field"
                placeholder="0"
                min="1"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="label">Fecha Objetivo</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creando...' : 'Crear Meta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
