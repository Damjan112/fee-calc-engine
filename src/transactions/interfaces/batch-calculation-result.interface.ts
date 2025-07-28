export interface BatchCalculationResult {
  processedTransactions: number;
  failedTransactions: number;
  totalAmount: number;
  totalFee: number;
  totalTime: number;
  averageProcessingTime: number;
  successRate: number;
  errors?: string[];
}
