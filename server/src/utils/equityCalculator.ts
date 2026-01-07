import { SplitType, ExpenseCategory } from '../models/SharedExpense';

export interface UserMonthlyFinances {
  userId: string;
  userName: string;
  totalIncome: number;
  fixedPersonalExpenses: number;
  netAvailable: number;
}

export interface ParticipationResult {
  user1: {
    userId: string;
    userName: string;
    netAvailable: number;
    participationPercentage: number;
  };
  user2: {
    userId: string;
    userName: string;
    netAvailable: number;
    participationPercentage: number;
  };
  totalNetAvailable: number;
}

export interface SharedExpenseItem {
  id: string;
  description: string;
  amount: number;
  paidByUserId: string;
  splitType: SplitType;
  beneficiaryUserId?: string;
  category: ExpenseCategory;
  date: Date;
}

export interface DebtResult {
  totalSharedExpenses: number;
  user1TotalPaid: number;
  user2TotalPaid: number;
  user1ShouldPay: number;
  user2ShouldPay: number;
  user1Balance: number;
  user2Balance: number;
  settlement: {
    debtorUserId: string;
    debtorUserName: string;
    creditorUserId: string;
    creditorUserName: string;
    amount: number;
  } | null;
}

export function calculateParticipation(
  user1: UserMonthlyFinances,
  user2: UserMonthlyFinances
): ParticipationResult {
  const totalNetAvailable = user1.netAvailable + user2.netAvailable;
  
  const user1Percentage = totalNetAvailable > 0 
    ? (user1.netAvailable / totalNetAvailable) * 100 
    : 50;
  const user2Percentage = totalNetAvailable > 0 
    ? (user2.netAvailable / totalNetAvailable) * 100 
    : 50;

  return {
    user1: {
      userId: user1.userId,
      userName: user1.userName,
      netAvailable: user1.netAvailable,
      participationPercentage: user1Percentage,
    },
    user2: {
      userId: user2.userId,
      userName: user2.userName,
      netAvailable: user2.netAvailable,
      participationPercentage: user2Percentage,
    },
    totalNetAvailable,
  };
}

export function calculateProportionalDebt(
  participation: ParticipationResult,
  expenses: SharedExpenseItem[]
): DebtResult {
  let totalSharedExpenses = 0;
  let user1TotalPaid = 0;
  let user2TotalPaid = 0;

  expenses.forEach((expense) => {
    const isPaidByUser1 = expense.paidByUserId === participation.user1.userId;

    if (expense.splitType === 'shared') {
      totalSharedExpenses += expense.amount;
      if (isPaidByUser1) {
        user1TotalPaid += expense.amount;
      } else {
        user2TotalPaid += expense.amount;
      }
    } else if (expense.splitType === 'paid_for_other') {
      totalSharedExpenses += expense.amount;
      if (isPaidByUser1) {
        user1TotalPaid += expense.amount;
      } else {
        user2TotalPaid += expense.amount;
      }
    } else if (expense.splitType === 'full_reimbursement') {
      totalSharedExpenses += expense.amount;
      if (isPaidByUser1) {
        user1TotalPaid += expense.amount;
      } else {
        user2TotalPaid += expense.amount;
      }
    }
  });

  const user1ShouldPay = (totalSharedExpenses * participation.user1.participationPercentage) / 100;
  const user2ShouldPay = (totalSharedExpenses * participation.user2.participationPercentage) / 100;

  const user1Balance = user1TotalPaid - user1ShouldPay;
  const user2Balance = user2TotalPaid - user2ShouldPay;

  let settlement = null;
  if (Math.abs(user1Balance) > 0.01) {
    if (user1Balance > 0) {
      settlement = {
        debtorUserId: participation.user2.userId,
        debtorUserName: participation.user2.userName,
        creditorUserId: participation.user1.userId,
        creditorUserName: participation.user1.userName,
        amount: Math.abs(user1Balance),
      };
    } else {
      settlement = {
        debtorUserId: participation.user1.userId,
        debtorUserName: participation.user1.userName,
        creditorUserId: participation.user2.userId,
        creditorUserName: participation.user2.userName,
        amount: Math.abs(user1Balance),
      };
    }
  }

  return {
    totalSharedExpenses,
    user1TotalPaid,
    user2TotalPaid,
    user1ShouldPay,
    user2ShouldPay,
    user1Balance,
    user2Balance,
    settlement,
  };
}

export function recalculateSavingsGoal(
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    originalTargetDate: Date;
    currentTargetDate: Date;
  },
  monthlyContribution: number,
  participation: ParticipationResult
) {
  const remaining = goal.targetAmount - goal.currentAmount;
  const now = new Date();
  const monthsToOriginalTarget = Math.max(
    1,
    (goal.originalTargetDate.getFullYear() - now.getFullYear()) * 12 +
      (goal.originalTargetDate.getMonth() - now.getMonth())
  );

  let adjustedTargetDate = goal.currentTargetDate;
  let canMeetOriginalTarget = true;

  if (monthlyContribution > 0) {
    const monthsNeeded = Math.ceil(remaining / monthlyContribution);
    if (monthsNeeded > monthsToOriginalTarget) {
      canMeetOriginalTarget = false;
      const newDate = new Date(now);
      newDate.setMonth(newDate.getMonth() + monthsNeeded);
      adjustedTargetDate = newDate;
    }
  }

  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    remaining,
    originalTargetDate: goal.originalTargetDate,
    currentTargetDate: adjustedTargetDate,
    monthlyContribution,
    user1Contribution: (monthlyContribution * participation.user1.participationPercentage) / 100,
    user2Contribution: (monthlyContribution * participation.user2.participationPercentage) / 100,
    canMeetOriginalTarget,
    monthsToTarget: monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : Infinity,
  };
}
