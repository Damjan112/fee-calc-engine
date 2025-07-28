export interface HistoryStatsDto {
  totalCalculations: number;
  totalTransactionAmount: number;
  totalFeesCalculated: number;
  averageFee: number;
  averageCalculationTime: number;
  successRate: number;
  calculationsByType: Record<string, number>;
  calculationsByDay: Array<{
    date: string;
    count: number;
    totalFees: number;
  }>;
  topRulesApplied: Array<{
    ruleDescription: string;
    count: number;
    totalFeeImpact: number;
  }>;
}