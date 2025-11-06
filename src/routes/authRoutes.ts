import { Router } from 'express';
import {
  verifyAccessCode,
  logout,
  checkAuth
} from '../controllers/authController';

const router = Router();

// Rutas de autenticación (públicas)
router.post('/auth/login', verifyAccessCode);
router.post('/auth/logout', logout);
router.get('/auth/check', checkAuth);

export default router;

