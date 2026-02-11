import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
export declare class ProxyController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    publicAuth(req: Request, res: Response): Promise<void>;
    externalServices(req: Request, res: Response): Promise<void>;
    proxy(req: Request, res: Response): Promise<void>;
    private forwardToService;
}
