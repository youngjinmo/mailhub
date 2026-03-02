import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

interface ClientInfo {
  ip: string;
  userAgent: string;
}

@Injectable()
export class ClientUtil {
  constructor() {}

  getClientInfo(request: Request): ClientInfo {
    return {
      ip: request.ip || request.socket.remoteAddress || '',
      userAgent: request.headers['user-agent'] || '',
    };
  }
}
