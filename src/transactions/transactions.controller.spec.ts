import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { FeeCalculationService } from './fee-calculation.service';
import { ClientsService } from '../clients/clients.service';
import { TransactionType, Currency, ClientSegment } from '../common/enums';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let mockFeeCalculationService: jest.Mocked<FeeCalculationService>;

  beforeEach(async () => {
    // Create mocks
    mockFeeCalculationService = {
      calculateFeePure: jest.fn(),
      batchCalculateFeePure: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: {} },
        { provide: FeeCalculationService, useValue: mockFeeCalculationService },
        { provide: ClientsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  describe('calculateFeePure', () => {
    it('should calculate fee for valid request', async () => {
      // Arrange
      const calculateFeeDto = {
        transaction: {
          type: TransactionType.POS,
          amount: 75,
          currency: Currency.EUR,
        },
        client: {
          name: 'Test Client',
          creditScore: 300,
          segment: ClientSegment.STANDARD,
          email: 'test@example.com',
        },
      };

      const expectedResult = {
        transaction: {
          id: 'temp-123',
          type: TransactionType.POS,
          amount: 75,
          currency: Currency.EUR,
          clientId: 'temp-client',
          createdAt: new Date(),
          client: {} as any, // Mock client relation
        },
        client: {
          id: 'temp-client',
          name: 'Test Client',
          creditScore: 300,
          segment: ClientSegment.STANDARD,
          email: 'test@example.com',
          transactions: [],
        },
        fee: 0.2,
        totalAmount: 75.2,
        appliedRules: [
          {
            id: '1',
            description: 'Fixed fee 0.20€ for POS ≤ 100€',
            fee: 0.2,
          },
        ],
        calculationTime: 5,
      };

      mockFeeCalculationService.calculateFeePure.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.calculateFeePure(calculateFeeDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockFeeCalculationService.calculateFeePure).toHaveBeenCalledWith(
        calculateFeeDto.transaction,
        calculateFeeDto.client,
      );
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});