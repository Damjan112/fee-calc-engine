import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuleService } from './rule.service';
import { FeeRule } from './rule.entity';
import { TransactionType, RuleTransactionType } from '../common/enums';

describe('RuleService', () => {
  let service: RuleService;
  let mockRepository: jest.Mocked<Repository<FeeRule>>;

  beforeEach(async () => {
    // Create mock repository
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleService,
        {
          provide: getRepositoryToken(FeeRule),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RuleService>(RuleService);
  });

  describe('createRule', () => {
    it('should create a new rule successfully', async () => {
      // Arrange
      const createRuleDto = {
        name: 'Test Rule',
        description: 'A test rule',
        type: RuleTransactionType.POS,
        conditions: {
          all: [
            {
              fact: 'transaction',
              path: '$.type',
              operator: 'equal',
              value: TransactionType.POS,
            },
          ],
        },
        event: {
          type: 'calculate-fee',
          params: {
            feeType: 'fixed',
            amount: 1.0,
          },
        },
        priority: 1,
        isActive: true,
      };

      const savedRule = { id: 1, ...createRuleDto } as FeeRule;

      mockRepository.create.mockReturnValue(savedRule);
      mockRepository.save.mockResolvedValue(savedRule);
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.createRule(createRuleDto);

      // Assert
      expect(result).toEqual(savedRule);
      expect(mockRepository.create).toHaveBeenCalledWith(createRuleDto);
      expect(mockRepository.save).toHaveBeenCalledWith(savedRule);
    });
  });

  describe('getAllRules', () => {
    it('should return all rules ordered by priority', async () => {
      // Arrange
      const mockRules = [
        { id: 1, name: 'Rule 1', priority: 2 },
        { id: 2, name: 'Rule 2', priority: 1 },
      ] as FeeRule[];

      mockRepository.find.mockResolvedValue(mockRules);

      // Act
      const result = await service.getAllRules();

      // Assert
      expect(result).toEqual(mockRules);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { priority: 'ASC' },
      });
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});