import express from 'express';
import path from 'path';
import { agentRouter } from './routes/agents';
import { userRouter } from './routes/users';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Parse JSON
app.use(express.json());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many requests, try again later' },
});

// Serve skill.md as a static file
// Agents access it via: curl -s https://yourapp.com/skill.md
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/agents', authLimiter, agentRouter);
app.use('/api/users', authLimiter, userRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Skill.md available at http://localhost:${PORT}/skill.md`);
});
