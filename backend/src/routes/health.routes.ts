'use strict';

import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();
const healthController = new HealthController();

router.get('/health', healthController.getHealth.bind(healthController));

export default router;
