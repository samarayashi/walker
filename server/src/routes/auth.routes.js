import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { validateRegistration, validateLogin } from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

export default router; 