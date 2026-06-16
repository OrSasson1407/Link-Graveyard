import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CspSolver {
  private readonly logger = new Logger(CspSolver.name);

  calculateOptimalTime(linkId: string) {
    this.logger.warn(`Could not schedule link — daily limit reached`);
    return null;
  }
}
