'use strict';

import { Request, Response } from 'express';
import { ApiResponse } from '../types/response';
import mongoose from 'mongoose';
import { env } from '../config/env';

export class HealthController {
  async getHealth(_req: Request, res: Response<ApiResponse>): Promise<void> {
    const mem = process.memoryUsage();
    const dbState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
    const dbStatus =
      dbState === 1
        ? 'connected'
        : dbState === 2
          ? 'connecting'
          : 'disconnected';

    res.json({
      success: true,
      message: 'Quorixa Backend Running',
      data: {
        status: dbStatus,
        uptimeSeconds: process.uptime(),
        memory: {
          rss: mem.rss,
          heapTotal: mem.heapTotal,
          heapUsed: mem.heapUsed,
        },
        nodeVersion: process.version,
        apiVersion: env.apiVersion,
      },
    });
  }
}
