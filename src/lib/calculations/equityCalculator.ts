/**
 * ALGORITMO DE CÁLCULO DE EQUIDAD PROPORCIONAL
 * 
 * Este módulo implementa la lógica central de ParejaFinance:
 * - Cálculo de participación basado en Neto Disponible
 * - Compensación de gastos compartidos
 * - Recálculo dinámico de metas de ahorro
 */

export interface UserMonthlyFinances {
  userId: string
  userName: string
  totalIncome: number
  fixedPersonalExpenses: number
  netAvailable: number
}

export interface SharedExpenseItem {
  id: string
  description: string
  amount: number
  paidByUserId: string
  splitType: 'shared' | 'personal' | 'paid_for_other' | 'full_reimbursement'
  beneficiaryUserId?: string
  category: string
  date: Date
}

export interface ParticipationResult {
  user1: {
    userId: string
    userName: string
    netAvailable: number
    participationPercentage: number
  }
  user2: {
    userId: string
    userName: string
    netAvailable: number
    participationPercentage: number
  }
  totalNetAvailable: number
}

export interface DebtCalculationResult {
  totalSharedExpenses: number
  user1ShouldPay: number
  user2ShouldPay: number
  user1ActuallyPaid: number
  user2ActuallyPaid: number
  user1Difference: number // Positivo = pagó de más, Negativo = pagó de menos
  user2Difference: number
  settlement: {
    debtorUserId: string | null
    debtorUserName: string
    creditorUserId: string | null
    creditorUserName: string
    amount: number
  } | null
}

export interface SavingsGoalRecalculation {
  goalId: string
  goalName: string
  targetAmount: number
  currentAmount: number
  remaining: number
  originalTargetDate: Date
  newTargetDate: Date
  monthlyContributionNeeded: number
  user1MonthlyContribution: number
  user2MonthlyContribution: number
  isDelayed: boolean
  monthsDelayed: number
}

/**
 * Calcula el Neto Disponible de cada usuario
 * Fórmula: Neto Disponible = Ingresos Totales - Gastos Fijos Personales
 */
export function calculateNetAvailable(
  totalIncome: number,
  fixedPersonalExpenses: number
): number {
  return Math.max(0, totalIncome - fixedPersonalExpenses)
}

/**
 * Calcula el porcentaje de participación de cada usuario
 * basado en la proporción de su Neto Disponible respecto al total
 */
export function calculateParticipation(
  user1Finances: UserMonthlyFinances,
  user2Finances: UserMonthlyFinances
): ParticipationResult {
  const totalNetAvailable = user1Finances.netAvailable + user2Finances.netAvailable

  // Si ambos tienen 0, dividimos 50/50
  if (totalNetAvailable === 0) {
    return {
      user1: {
        userId: user1Finances.userId,
        userName: user1Finances.userName,
        netAvailable: 0,
        participationPercentage: 50,
      },
      user2: {
        userId: user2Finances.userId,
        userName: user2Finances.userName,
        netAvailable: 0,
        participationPercentage: 50,
      },
      totalNetAvailable: 0,
    }
  }

  const user1Percentage = (user1Finances.netAvailable / totalNetAvailable) * 100
  const user2Percentage = (user2Finances.netAvailable / totalNetAvailable) * 100

  return {
    user1: {
      userId: user1Finances.userId,
      userName: user1Finances.userName,
      netAvailable: user1Finances.netAvailable,
      participationPercentage: Math.round(user1Percentage * 100) / 100,
    },
    user2: {
      userId: user2Finances.userId,
      userName: user2Finances.userName,
      netAvailable: user2Finances.netAvailable,
      participationPercentage: Math.round(user2Percentage * 100) / 100,
    },
    totalNetAvailable,
  }
}

/**
 * Calcula la deuda proporcional entre usuarios
 * Cruza lo que realmente pagó cada uno vs. lo que le correspondía según su %
 * Considera diferentes tipos de gastos: shared, personal, paid_for_other
 */
export function calculateProportionalDebt(
  participation: ParticipationResult,
  expenses: SharedExpenseItem[]
): DebtCalculationResult {
  // Filtrar solo gastos compartidos para el total
  const sharedExpenses = expenses.filter(exp => exp.splitType === 'shared')
  const totalSharedExpenses = sharedExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Lo que debería pagar cada uno según su porcentaje (solo gastos compartidos)
  const user1ShouldPay = (participation.user1.participationPercentage / 100) * totalSharedExpenses
  const user2ShouldPay = (participation.user2.participationPercentage / 100) * totalSharedExpenses

  // Calcular lo que realmente pagó cada uno, considerando el tipo de gasto
  let user1ActuallyPaid = 0
  let user2ActuallyPaid = 0

  expenses.forEach((exp) => {
    if (exp.splitType === 'shared') {
      // Gasto compartido: quien pagó suma el monto completo
      if (exp.paidByUserId === participation.user1.userId) {
        user1ActuallyPaid += exp.amount
      } else if (exp.paidByUserId === participation.user2.userId) {
        user2ActuallyPaid += exp.amount
      }
    } else if (exp.splitType === 'personal') {
      // Gasto personal: no afecta el balance entre usuarios
      // No se suma a ningún lado
    } else if (exp.splitType === 'paid_for_other') {
      // Pagado a favor de otra persona: quien pagó debe recibir el monto completo de vuelta
      if (exp.paidByUserId === participation.user1.userId && exp.beneficiaryUserId === participation.user2.userId) {
        user1ActuallyPaid += exp.amount
      } else if (exp.paidByUserId === participation.user2.userId && exp.beneficiaryUserId === participation.user1.userId) {
        user2ActuallyPaid += exp.amount
      }
    }
  })

  // Diferencia: positivo = pagó de más, negativo = pagó de menos
  const user1Difference = user1ActuallyPaid - user1ShouldPay
  const user2Difference = user2ActuallyPaid - user2ShouldPay

  // Determinar quién debe a quién
  let settlement: DebtCalculationResult['settlement'] = null

  if (Math.abs(user1Difference) > 0.01) {
    // Tolerancia de 1 centavo
    if (user1Difference > 0) {
      // User1 pagó de más, User2 le debe
      settlement = {
        debtorUserId: participation.user2.userId,
        debtorUserName: participation.user2.userName,
        creditorUserId: participation.user1.userId,
        creditorUserName: participation.user1.userName,
        amount: Math.round(user1Difference * 100) / 100,
      }
    } else {
      // User2 pagó de más, User1 le debe
      settlement = {
        debtorUserId: participation.user1.userId,
        debtorUserName: participation.user1.userName,
        creditorUserId: participation.user2.userId,
        creditorUserName: participation.user2.userName,
        amount: Math.round(Math.abs(user1Difference) * 100) / 100,
      }
    }
  }

  return {
    totalSharedExpenses: Math.round(totalSharedExpenses * 100) / 100,
    user1ShouldPay: Math.round(user1ShouldPay * 100) / 100,
    user2ShouldPay: Math.round(user2ShouldPay * 100) / 100,
    user1ActuallyPaid: Math.round(user1ActuallyPaid * 100) / 100,
    user2ActuallyPaid: Math.round(user2ActuallyPaid * 100) / 100,
    user1Difference: Math.round(user1Difference * 100) / 100,
    user2Difference: Math.round(user2Difference * 100) / 100,
    settlement,
  }
}

/**
 * Recalcula la fecha objetivo de una meta de ahorro
 * Si no se puede aportar la cuota completa, estira la fecha en lugar de generar deuda
 */
export function recalculateSavingsGoal(
  goal: {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    originalTargetDate: Date
    currentTargetDate: Date
  },
  monthlyContributionAvailable: number,
  participation: ParticipationResult
): SavingsGoalRecalculation {
  const remaining = goal.targetAmount - goal.currentAmount

  if (remaining <= 0) {
    // Meta completada
    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remaining: 0,
      originalTargetDate: goal.originalTargetDate,
      newTargetDate: goal.currentTargetDate,
      monthlyContributionNeeded: 0,
      user1MonthlyContribution: 0,
      user2MonthlyContribution: 0,
      isDelayed: false,
      monthsDelayed: 0,
    }
  }

  const now = new Date()
  const originalMonthsRemaining = Math.max(
    1,
    (goal.originalTargetDate.getFullYear() - now.getFullYear()) * 12 +
      (goal.originalTargetDate.getMonth() - now.getMonth())
  )

  const idealMonthlyContribution = remaining / originalMonthsRemaining

  let newTargetDate = new Date(goal.currentTargetDate)
  let monthlyContributionNeeded = idealMonthlyContribution
  let isDelayed = false
  let monthsDelayed = 0

  // Si no alcanza para la cuota ideal, recalcular fecha
  if (monthlyContributionAvailable < idealMonthlyContribution && monthlyContributionAvailable > 0) {
    const monthsNeeded = Math.ceil(remaining / monthlyContributionAvailable)
    newTargetDate = new Date(now)
    newTargetDate.setMonth(newTargetDate.getMonth() + monthsNeeded)
    monthlyContributionNeeded = monthlyContributionAvailable
    isDelayed = true

    const originalEndMonth =
      goal.originalTargetDate.getFullYear() * 12 + goal.originalTargetDate.getMonth()
    const newEndMonth = newTargetDate.getFullYear() * 12 + newTargetDate.getMonth()
    monthsDelayed = Math.max(0, newEndMonth - originalEndMonth)
  }

  // Distribuir el aporte mensual según participación
  const user1MonthlyContribution =
    (participation.user1.participationPercentage / 100) * monthlyContributionNeeded
  const user2MonthlyContribution =
    (participation.user2.participationPercentage / 100) * monthlyContributionNeeded

  return {
    goalId: goal.id,
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    remaining: Math.round(remaining * 100) / 100,
    originalTargetDate: goal.originalTargetDate,
    newTargetDate,
    monthlyContributionNeeded: Math.round(monthlyContributionNeeded * 100) / 100,
    user1MonthlyContribution: Math.round(user1MonthlyContribution * 100) / 100,
    user2MonthlyContribution: Math.round(user2MonthlyContribution * 100) / 100,
    isDelayed,
    monthsDelayed,
  }
}

/**
 * Función principal que calcula todo el estado financiero del mes
 */
export function calculateMonthlyFinancialStatus(
  user1Finances: UserMonthlyFinances,
  user2Finances: UserMonthlyFinances,
  sharedExpenses: SharedExpenseItem[],
  savingsGoals: Array<{
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    originalTargetDate: Date
    currentTargetDate: Date
  }>,
  availableForSavings: number
) {
  // 1. Calcular participación
  const participation = calculateParticipation(user1Finances, user2Finances)

  // 2. Calcular deuda proporcional
  const debtResult = calculateProportionalDebt(participation, sharedExpenses)

  // 3. Recalcular metas de ahorro
  const savingsRecalculations = savingsGoals.map((goal) =>
    recalculateSavingsGoal(goal, availableForSavings / savingsGoals.length, participation)
  )

  return {
    participation,
    debtResult,
    savingsRecalculations,
    summary: {
      user1Name: user1Finances.userName,
      user2Name: user2Finances.userName,
      user1Percentage: participation.user1.participationPercentage,
      user2Percentage: participation.user2.participationPercentage,
      whoOwesWhom: debtResult.settlement
        ? `${debtResult.settlement.debtorUserName} debe $${debtResult.settlement.amount} a ${debtResult.settlement.creditorUserName}`
        : 'Están a mano 🎉',
    },
  }
}
