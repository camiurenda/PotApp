import mongoose, { Schema, Document } from 'mongoose'

export type ExpenseCategory = 
  | 'alquiler'
  | 'supermercado'
  | 'servicios' // luz, agua, gas, internet
  | 'transporte'
  | 'salud'
  | 'entretenimiento'
  | 'restaurantes'
  | 'otros'

export type SplitType = 
  | 'shared' // Compartido equitativamente (50/50)
  | 'personal' // Gasto personal (solo quien pagó)
  | 'paid_for_other' // Pagado por otra persona (quien pagó lo hace por el otro, que debe el total)
  | 'full_reimbursement' // Reembolso total (el otro debe devolver todo)

export interface ISharedExpense extends Document {
  _id: mongoose.Types.ObjectId
  description: string
  amount: number
  category: ExpenseCategory
  paidByUserId: mongoose.Types.ObjectId // Quién pagó
  splitType: SplitType // Tipo de división del gasto
  beneficiaryUserId?: mongoose.Types.ObjectId // Para paid_for_other: quién es el beneficiario
  date: Date
  year: number
  month: number
  createdAt: Date
  updatedAt: Date
}

const SharedExpenseSchema = new Schema<ISharedExpense>(
  {
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'El monto es requerido'],
      min: [0.01, 'El monto debe ser mayor a 0'],
    },
    category: {
      type: String,
      enum: ['alquiler', 'supermercado', 'servicios', 'transporte', 'salud', 'entretenimiento', 'restaurantes', 'otros'],
      default: 'otros',
    },
    paidByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splitType: {
      type: String,
      enum: ['shared', 'personal', 'paid_for_other', 'full_reimbursement'],
      default: 'shared',
      required: true,
    },
    beneficiaryUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
  },
  {
    timestamps: true,
  }
)

// Índice para consultas por mes/año
SharedExpenseSchema.index({ year: 1, month: 1 })
SharedExpenseSchema.index({ paidByUserId: 1 })

export default mongoose.models.SharedExpense || mongoose.model<ISharedExpense>('SharedExpense', SharedExpenseSchema)
