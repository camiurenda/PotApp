import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlyData extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  year: number;
  month: number;
  totalIncome: number;
  fixedPersonalExpenses: number;
  netAvailable: number;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyDataSchema = new Schema<IMonthlyData>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    totalIncome: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    fixedPersonalExpenses: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    netAvailable: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

MonthlyDataSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

MonthlyDataSchema.pre('save', function (next) {
  this.netAvailable = this.totalIncome - this.fixedPersonalExpenses;
  next();
});

export default mongoose.models.MonthlyData || mongoose.model<IMonthlyData>('MonthlyData', MonthlyDataSchema);
