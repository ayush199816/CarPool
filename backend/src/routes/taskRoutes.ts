import { Router } from 'express';
import { getTasks, createTask } from '../controllers/taskController';

const router = Router();

// Task routes
router.get('/', getTasks);
router.post('/', createTask);

export default router;
