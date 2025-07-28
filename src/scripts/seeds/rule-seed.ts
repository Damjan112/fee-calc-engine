import { RuleTransactionType, TransactionType } from '../../common/enums';
import { FeeRule } from '../../rules/rule.entity';

export const initialRules: Partial<FeeRule>[] = [
  {
    name: 'POS Fixed Fee',
    description: 'Fixed fee 0.20€ for POS ≤ 100€, otherwise 0.2% of amount',
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
    isActive: true,
  },
  {
    name: 'E-commerce Fee',
    description: '1.8% + 0.15€, max 120€, for e-commerce',
    type: RuleTransactionType.ECOMMERCE,
    conditions: {
      all: [
        {
          fact: 'transaction',
          path: '$.type',
          operator: 'equal',
          value: TransactionType.ECOMMERCE,
        },
      ],
    },
    event: {
      type: 'calculate-fee',
      params: {
        feeType: 'percentage_plus_fixed',
        percentage: 0.018,
        fixedAmount: 0.15,
        cap: 120,
      },
    },
    priority: 2,
    isActive: true,
  },
  {
    name: 'Credit Score Discount',
    description: '1% discount if creditScore > 400',
    type: RuleTransactionType.ANY,
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
        feeType: 'percentage',
        percentage: -0.01,
      },
    },
    priority: 10,
    isActive: true,
  },
  {
    name: 'Large Transaction Surcharge',
    description: 'Additional 0.5% fee for transactions over €5000',
    type: RuleTransactionType.ANY,
    conditions: {
      all: [
        {
          fact: 'transaction',
          path: '$.amount',
          operator: 'greaterThan',
          value: 5000,
        },
      ],
    },
    event: {
      type: 'calculate-fee',
      params: {
        feeType: 'percentage',
        percentage: 0.005,
      },
    },
    priority: 5,
    isActive: true,
  },
];
