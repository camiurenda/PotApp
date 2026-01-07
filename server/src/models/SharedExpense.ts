import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseCategory = 
  | 'alquiler'
  | 'supermercado'
  | 'servicios'
  | 'transporte'
  | 'salud'
  | 'entretenimiento'
  | 'restaurantes'
  | 'otros';

export type SplitType = 
  | 'shared'
  | 'personal'
  | 'paid_for_other'
  | 'full_reimbursement';

export interface ISharedExpense extends Document {
  _id: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paidByUserId: mongoose.Types.ObjectId;
  splitType: SplitType;
  beneficiaryUserId?: mongoose.Types.ObjectId;
  date: Date;
  year: number;
  month: number;
  createdAt: Date;
  updatedAt: Date;
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
);

SharedExpenseSchema.index({ year: 1, month: 1 });
SharedExpenseSchema.index({ paidByUserId: 1 });

export default mongoose.models.SharedExpense || mongoose.model<ISharedExpense>('SharedExpense', SharedExpenseSchema);
