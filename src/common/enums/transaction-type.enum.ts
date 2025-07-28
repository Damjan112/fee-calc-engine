// Core transaction types that represent actual business transactions
export enum TransactionType {
  POS = 'POS',
  ECOMMERCE = 'ECOMMERCE',
  TRANSFER = 'TRANSFER',
  ATM = 'ATM',
  ONLINE = 'ONLINE',
}

// Extended for rule matching (includes ANY for universal rules)
export enum RuleTransactionType {
  POS = TransactionType.POS,
  ECOMMERCE = TransactionType.ECOMMERCE,
  TRANSFER = TransactionType.TRANSFER,
  ATM = TransactionType.ATM,
  ONLINE = TransactionType.ONLINE,
  ANY = 'ANY',
}

// For backward compatibility
export const BaseTransactionType = TransactionType;
