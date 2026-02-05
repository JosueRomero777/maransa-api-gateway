import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('proxy')
@Controller('api')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Public routes - No authentication required
   */
  @All(['auth/login', 'auth/register', 'auth/check-email'])
  @ApiOperation({ summary: 'Public authentication endpoints' })
  async publicAuth(@Req() req: Request, @Res() res: Response) {
    return this.forwardToService(req, res);
  }

  /**
   * Protected routes - Authentication required
   */
  @All('*')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Forward request to appropriate microservice' })
  async proxy(@Req() req: Request, @Res() res: Response) {
    return this.forwardToService(req, res);
  }

  /**
   * Common forwarding logic
   */
  private async forwardToService(req: Request, res: Response) {
    try {
      const originalPath = req.path;
      const serviceName = this.proxyService.getServiceNameFromRoute(originalPath);
      const targetPath = this.proxyService.transformPath(originalPath, serviceName);

      // Extract headers (exclude host, connection, etc.)
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;
      // Keep content-length for multipart, axios will handle it
      const contentType = headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        delete headers['content-length'];
      }

      // Forward request (pass req for multipart streaming)
      const result = await this.proxyService.forwardRequest(
        serviceName,
        targetPath,
        req.method,
        req.body,
        headers as Record<string, string>,
        req.query,
        contentType.includes('multipart/form-data') ? req : undefined,
      );

      // Return response
      res.status(result.status).json(result.data);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json(error.getResponse());
      } else {
        res.status(500).json({
          statusCode: 500,
          message: 'Internal gateway error',
          error: error.message,
        });
      }
    }
  }
}
