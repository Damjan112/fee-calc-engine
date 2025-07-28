import { Test, TestingModule } from '@nestjs/testing';
import { FeeCalculationService } from './fee-calculation.service';
import { RuleService } from '../rules/rule.service';
import { ClientsService } from '../clients/clients.service';
import { HistoryService } from '../history/history.service';
import { TransactionType, Currency, ClientSegment } from '../common/enums';

describe('FeeCalculationService', () => {
  let service: FeeCalculationService;
  let mockRuleService: jest.Mocked<RuleService>;
  let mockHistoryService: jest.Mocked<HistoryService>;

  beforeEach(async () => {
    // Create mocks
    mockRuleService = {
      evaluateRules: jest.fn(),
    } as any;

    mockHistoryService = {
      recordSingleCalculation: jest.fn().mockResolvedValue({}),
      recordBatchCalculation: jest.fn().mockResolvedValue({}),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeCalculationService,
        { provide: RuleService, useValue: mockRuleService },
        { provide: ClientsService, useValue: {} },
        { provide: HistoryService, useValue: mockHistoryService },
      ],
    }).compile();

    service = module.get<FeeCalculationService>(FeeCalculationService);
  });

  describe('calculateFeePure', () => {
    it('should calculate fee for POS transaction ≤ €100 (Rule #1)', async () => {
      // Arrange
      const transactionData = {
        type: TransactionType.POS,
        amount: 75,
        currency: Currency.EUR,
      };
      const clientData = {
        name: 'Test Client',
        creditScore: 300,
        segment: ClientSegment.STANDARD,
      };

      mockRuleService.evaluateRules.mockResolvedValue([
        {
          ruleId: 1,
          ruleName: 'POS Fixed Fee',
          description: 'Fixed fee 0.20€ for POS ≤ 100€',
          feeAmount: 0.2,
        },
      ]);

      // Act
      const result = await service.calculateFeePure(transactionData, clientData);

      // Assert
      expect(result.fee).toBe(0.2);
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].description).toContain('Fixed fee');
      expect(result.totalAmount).toBe(75.2);
    });

    it('should calculate fee for E-commerce transaction (Rule #2)', async () => {
      // Arrange
      const transactionData = {
        type: TransactionType.ECOMMERCE,
        amount: 1000,
        currency: Currency.EUR,
      };
      const clientData = {
        name: 'E-commerce Client',
        creditScore: 300,
        segment: ClientSegment.STANDARD,
      };

      mockRuleService.evaluateRules.mockResolvedValue([
        {
          ruleId: 2,
          ruleName: 'E-commerce Fee',
          description: '1.8% + 0.15€, max 120€, for e-commerce',
          feeAmount: 18.15,
        },
      ]);

      // Act
      const result = await service.calculateFeePure(transactionData, clientData);

      // Assert
      expect(result.fee).toBe(18.15);
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].description).toContain('e-commerce');
    });

    it('should handle multiple rules (POS + Credit Discount)', async () => {
      // Arrange
      const transactionData = {
        type: TransactionType.POS,
        amount: 250,
        currency: Currency.EUR,
      };
      const clientData = {
        name: 'Premium Client',
        creditScore: 450,
        segment: ClientSegment.PREMIUM,
      };

      mockRuleService.evaluateRules.mockResolvedValue([
        {
          ruleId: 1,
          ruleName: 'POS Percentage Fee',
          description: 'Fixed fee 0.20€ for POS ≤ 100€, otherwise 0.2% of amount',
          feeAmount: 0.5,
        },
        {
          ruleId: 3,
          ruleName: 'Credit Score Discount',
          description: '1% discount if creditScore > 400',
          feeAmount: -2.5,
        },
      ]);

      // Act
      const result = await service.calculateFeePure(transactionData, clientData);

      // Assert
      expect(result.fee).toBe(-2); // 0.5 - 2.5 = -2
      expect(result.appliedRules).toHaveLength(2);
      expect(result.totalAmount).toBe(248); // 250 + (-2)
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});