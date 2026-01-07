import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import expensesRoutes from './routes/expenses';
import savingsRoutes from './routes/savings';
import monthlyDataRoutes from './routes/monthlyData';
import seedRoutes from './routes/seed';
import resetRoutes from './routes/reset';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/monthly-data', monthlyDataRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/reset', resetRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
