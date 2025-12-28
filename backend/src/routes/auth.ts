import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { LoginRequest } from '../types';

const router = Router();

router.post('/login', (req: Request<{}, {}, LoginRequest>, res: Response) => {
  const { username, password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUsername && password === adminPassword) {
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({ token, username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

export default router;
