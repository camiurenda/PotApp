import mongoose, { Schema, Document } from 'mongoose'

export interface ISavingsContribution {
  date: Date
  amount: number
  userId: mongoose.Types.ObjectId
}

export interface ISavingsGoal extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  targetAmount: number // Monto objetivo
  currentAmount: number // Monto actual ahorrado
  originalTargetDate: Date // Fecha objetivo original
  currentTargetDate: Date // Fecha objetivo actual (puede estirarse)
  monthlyContributionTarget: number // Aporte mensual objetivo
  contributions: ISavingsContribution[] // Historial de aportes
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

const SavingsContributionSchema = new Schema<ISavingsContribution>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
)

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la meta es requerido'],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, 'El monto objetivo es requerido'],
      min: [1, 'El monto objetivo debe ser mayor a 0'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    originalTargetDate: {
      type: Date,
      required: [true, 'La fecha objetivo es requerida'],
    },
    currentTargetDate: {
      type: Date,
      required: true,
    },
    monthlyContributionTarget: {
      type: Number,
      default: 0,
    },
    contributions: [SavingsContributionSchema],
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Calcular el aporte mensual objetivo al crear
SavingsGoalSchema.pre('save', function (next) {
  if (this.isNew) {
    this.currentTargetDate = this.originalTargetDate
  }
  
  // Recalcular aporte mensual basado en lo que falta
  const remaining = this.targetAmount - this.currentAmount
  const now = new Date()
  const monthsRemaining = Math.max(
    1,
    (this.currentTargetDate.getFullYear() - now.getFullYear()) * 12 +
      (this.currentTargetDate.getMonth() - now.getMonth())
  )
  
  this.monthlyContributionTarget = remaining / monthsRemaining
  this.isCompleted = this.currentAmount >= this.targetAmount
  
  next()
})

export default mongoose.models.SavingsGoal || mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema)
