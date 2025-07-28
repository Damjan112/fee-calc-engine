import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Engine } from 'json-rules-engine';
import { FeeRule } from './rule.entity';
import { CreateRuleDto } from './dto/create-rule.dto';

interface RuleEngineResult {
  ruleId: number;
  ruleName: string;
  description: string;
  feeAmount: number;
}

@Injectable()
export class RuleService {
  private readonly logger = new Logger(RuleService.name);
  private engine: Engine;
  private lastUpdate: Date | null = null;

  constructor(
    @InjectRepository(FeeRule)
    private ruleRepository: Repository<FeeRule>,
  ) {
    this.engine = new Engine();
    this.setupCustomOperators();
    // Load rules on service initialization
    this.loadRules();
  }

  private setupCustomOperators(): void {
    // Add custom dayOfWeek operator
    this.engine.addOperator(
      'dayOfWeek',
      (factValue: any, jsonValue: number[]) => {
        if (!factValue) return false;
        const date = new Date(factValue);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        return jsonValue.includes(dayOfWeek);
      },
    );

    // Add custom timeRange operator for business hours
    this.engine.addOperator(
      'timeRange',
      (factValue: any, jsonValue: { start: string; end: string }) => {
        if (!factValue) return false;
        const date = new Date(factValue);
        const hour = date.getHours();
        const startHour = parseInt(jsonValue.start.split(':')[0]);
        const endHour = parseInt(jsonValue.end.split(':')[0]);
        return hour >= startHour && hour < endHour;
      },
    );
  }

  async loadRules(): Promise<void> {
    try {
      const rules = await this.ruleRepository.find({
        where: { isActive: true },
        order: { priority: 'ASC' },
      });

      // Clear existing rules
      this.engine = new Engine();
      this.setupCustomOperators();

      // Add rules to engine
      rules.forEach((rule) => {
        try {
          this.engine.addRule({
            conditions: rule.conditions,
            event: {
              ...rule.event,
              params: {
                ...rule.event.params,
                ruleId: rule.id,
                ruleName: rule.name,
                description: rule.description,
              },
            },
            priority: rule.priority,
          });
        } catch (error) {
          this.logger.error(
            `Failed to add rule ${rule.name}: ${error.message}`,
          );
        }
      });

      this.lastUpdate = new Date();
      this.logger.log(`Loaded ${rules.length} active rules into engine`);
    } catch (error) {
      this.logger.error('Failed to load rules from database', error);
      this.loadDefaultRules();
    }
  }

  private loadDefaultRules(): void {
    this.engine = new Engine();
    this.setupCustomOperators();

    // Rule #1: POS Fixed Fee
    this.engine.addRule({
      conditions: {
        all: [
          {
            fact: 'transaction',
            path: '$.type',
            operator: 'equal',
            value: 'POS',
          },
        ],
      },
      event: {
        type: 'calculate-fee',
        params: {
          ruleId: 1,
          ruleName: 'POS Fixed Fee',
          description:
            'Fixed fee 0.20€ for POS ≤ 100€, otherwise 0.2% of amount',
          feeType: 'conditional',
          condition: {
            field: 'amount',
            operator: 'lessThanInclusive',
            value: 100,
          },
          fixedFee: 0.2,
          percentageFee: 0.002,
        },
      },
      priority: 1,
    });

    // Rule #2: E-commerce Fee
    this.engine.addRule({
      conditions: {
        all: [
          {
            fact: 'transaction',
            path: '$.type',
            operator: 'equal',
            value: 'ECOMMERCE',
          },
        ],
      },
      event: {
        type: 'calculate-fee',
        params: {
          ruleId: 2,
          ruleName: 'E-commerce Fee',
          description: '1.8% + 0.15€, max 120€, for e-commerce',
          feeType: 'percentage_plus_fixed',
          percentage: 0.018,
          fixedAmount: 0.15,
          cap: 120,
        },
      },
      priority: 2,
    });

    // Rule #3: Credit Score Discount
    this.engine.addRule({
      conditions: {
        all: [
          {
            fact: 'client',
            path: '$.creditScore',
            operator: 'greaterThan',
            value: 400,
          },
        ],
      },
      event: {
        type: 'calculate-fee',
        params: {
          ruleId: 3,
          ruleName: 'Credit Score Discount',
          description: '1% discount if creditScore > 400',
          feeType: 'percentage',
          percentage: -0.01,
        },
      },
      priority: 10,
    });

    this.logger.warn('Loaded default rules due to database unavailability');
  }

  async evaluateRules(
    transaction: any,
    client: any,
  ): Promise<RuleEngineResult[]> {
    const facts = { transaction, client };

    try {
      const { events } = await this.engine.run(facts);

      return events.map((event) => {
        const fee = this.calculateFeeFromEvent(event, transaction);
        const params = event.params || {};
        return {
          ruleId: params.ruleId || 0,
          ruleName: params.ruleName || 'Unknown Rule',
          description: params.description || 'No description',
          feeAmount: fee,
        };
      });
    } catch (error: any) {
      this.logger.error('Error evaluating rules:', error);
      throw new Error('Rule evaluation failed');
    }
  }

  private calculateFeeFromEvent(
    event: any,
    transaction: any,
  ): number {
    const params = event.params;

    if (!params) {
      this.logger.warn('Event params are undefined');
      return 0;
    }

    switch (params.feeType) {
      case 'fixed':
        return params.amount || 0;

      case 'percentage':
        return transaction.amount * (params.percentage || 0);

      case 'percentage_plus_fixed':
        const fee =
          transaction.amount * (params.percentage || 0) +
          (params.fixedAmount || 0);
        return params.cap ? Math.min(fee, params.cap) : fee;

      case 'conditional':
        if (params.condition && transaction.amount <= params.condition.value) {
          return params.fixedFee || 0;
        } else {
          return transaction.amount * (params.percentageFee || 0);
        }

      default:
        this.logger.warn(`Unknown fee type: ${params.feeType}`);
        return 0;
    }
  }

  getEngine(): Engine {
    return this.engine;
  }

  async createRule(createRuleDto: CreateRuleDto): Promise<FeeRule> {
    // Validate rule by testing it with the engine
    const testEngine = new Engine();
    try {
      testEngine.addRule({
        conditions: createRuleDto.conditions,
        event: createRuleDto.event,
        priority: createRuleDto.priority || 1,
      });
    } catch (error: any) {
      throw new Error(`Invalid rule format: ${error.message}`);
    }

    const rule = this.ruleRepository.create(createRuleDto);
    const savedRule = await this.ruleRepository.save(rule);

    // Reload rules to include the new one
    await this.loadRules();

    this.logger.log(`Created new rule: ${savedRule.name}`);
    return savedRule;
  }

  async updateRule(
    id: number,
    updateRuleDto: Partial<CreateRuleDto>,
  ): Promise<FeeRule | null> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      return null;
    }

    // Validate updated rule if conditions or event changed
    if (updateRuleDto.conditions || updateRuleDto.event) {
      const testEngine = new Engine();
      try {
        testEngine.addRule({
          conditions: updateRuleDto.conditions || rule.conditions,
          event: updateRuleDto.event || rule.event,
          priority: updateRuleDto.priority || rule.priority,
        });
      } catch (error: any) {
        throw new Error(`Invalid rule format: ${error.message}`);
      }
    }

    Object.assign(rule, updateRuleDto);
    const updatedRule = await this.ruleRepository.save(rule);

    // Reload rules to reflect changes
    await this.loadRules();

    this.logger.log(`Updated rule: ${updatedRule.name}`);
    return updatedRule;
  }

  async deleteRule(id: number): Promise<boolean> {
    const result = await this.ruleRepository.delete(id);
    if (result.affected && result.affected > 0) {
      await this.loadRules();
      this.logger.log(`Deleted rule with ID: ${id}`);
      return true;
    }
    return false;
  }

  async getAllRules(): Promise<FeeRule[]> {
    return this.ruleRepository.find({ order: { priority: 'ASC' } });
  }

  async getRuleById(id: number): Promise<FeeRule | null> {
    return this.ruleRepository.findOne({ where: { id } });
  }

  async toggleRule(id: number): Promise<FeeRule | null> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      return null;
    }

    rule.isActive = !rule.isActive;
    const updatedRule = await this.ruleRepository.save(rule);

    await this.loadRules();

    this.logger.log(
      `${rule.isActive ? 'Activated' : 'Deactivated'} rule: ${rule.name}`,
    );
    return updatedRule;
  }

  getLastUpdate(): Date | null {
    return this.lastUpdate;
  }
}
