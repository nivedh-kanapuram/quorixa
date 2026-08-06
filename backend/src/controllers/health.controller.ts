"use strict";

import { Request, Response } from 'express';
import { ApiResponse } from '../types/response';

export class HealthController {
  async getHealth(_req: Request, res: Response<ApiResponse>): Promise<void> {
    res.json({
      success: true,
      message: 'Quorixa Backend Running',
      data: {
        status: 'OK',
        uptime: process.uptime(),
      },
    });
  }
}
