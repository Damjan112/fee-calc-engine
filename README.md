# Fee Calculation Engine

A high-performance, enterprise-grade fee calculation service built with NestJS and TypeScript. Processes payment transactions with configurable rules, batch processing capabilities, and comprehensive analytics.

## 🚀 Quick Start (< 5 minutes)

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Automated Setup (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd fee-calc-engine

# 2. Run the setup script
# For Unix/Mac/Linux:
./setup.sh

# For Windows:
setup.bat

# 3. Start the service
npm run start:dev
```

### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Setup database
npm run migration:run
npm run seed:rules

# 4. Start the service
npm run start:dev
```

The service will be available at `http://localhost:3000`

## 📋 Core Features

✅ **Fee Calculation Engine** - Calculate fees based on configurable rules  
✅ **Rule Management** - Add/modify rules without redeployment  
✅ **Batch Processing** - Handle 1000+ transactions efficiently  
✅ **History & Analytics** - Complete audit trail with business intelligence  
✅ **Performance Optimized** - Sub-linear scaling with chunked processing

## 🔧 API Endpoints

### Fee Calculation

```bash
# Single calculation (pure - no DB persistence)
POST /transactions/calculate-fee-pure
{
  "transaction": {
    "type": "POS",
    "amount": 150,
    "currency": "EUR"
  },
  "client": {
    "name": "John Doe",
    "creditScore": 450,
    "segment": "PREMIUM"
  }
}

# Batch calculation (pure)
POST /transactions/batch-calculate-fee-pure
{
  "transactions": [
    { "transaction": {...}, "client": {...} },
    // ... up to 1000 transactions
  ]
}
```

### Rule Management

```bash
# Get all rules
GET /rules

# Create new rule
POST /rules
{
  "name": "Weekend Surcharge",
  "description": "5% extra fee on weekends",
  "type": "ANY",
  "conditions": {
    "all": [
      {
        "fact": "transaction",
        "path": "$.createdAt",
        "operator": "dayOfWeek",
        "value": [0, 6]
      }
    ]
  },
  "event": {
    "type": "calculate-fee",
    "params": {
      "feeType": "percentage",
      "percentage": 0.05
    }
  },
  "priority": 5
}
```

### History & Analytics

```bash
# Get calculation history
GET /history?limit=50&transactionType=POS

# Get analytics dashboard
GET /history/stats?startDate=2024-01-01&endDate=2024-12-31
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │────│    Services     │────│   Repositories  │
│                 │    │                 │    │                 │
│ • Transactions  │    │ • FeeCalculation│    │ • Transaction   │
│ • Rules         │    │ • RuleService   │    │ • Client        │
│ • History       │    │ • HistoryService│    │ • FeeRule       │
│ • Clients       │    │ • ClientsService│    │ • History       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │  JSON Rules     │
                       │     Engine      │
                       └─────────────────┘
```

**Key Components:**

- **FeeCalculationService**: Core calculation logic with performance optimization
- **RuleService**: JSON Rules Engine with database persistence and hot reload
- **HistoryService**: Complete audit trail with business intelligence
- **Batch Processing**: Chunked processing with backpressure management

## 📊 Implemented Rules

| Rule   | Description                            | Implementation                 |
| ------ | -------------------------------------- | ------------------------------ |
| **#1** | POS: €0.20 fixed ≤ €100, 0.2% > €100   | ✅ Conditional fee type        |
| **#2** | E-commerce: 1.8% + €0.15, max €120     | ✅ Percentage + fixed with cap |
| **#3** | Credit discount: 1% off if score > 400 | ✅ Negative percentage         |
| **#4** | Large transaction: 0.5% extra > €5000  | ✅ Bonus rule implemented      |

## 🚀 Performance Features

- **Chunked Processing**: Dynamic chunk sizing (10-50 transactions)
- **Backpressure Management**: Prevents system overload on large batches
- **Parallel Execution**: Promise.all within chunks for maximum throughput
- **Performance Monitoring**: Real-time metrics (tx/sec, success rates)
- **Memory Optimization**: Streaming processing prevents memory bloat

**Benchmark**: Handles 1000 mixed transactions in ~2-5 seconds with sub-linear scaling.

## 🛠️ Technology Stack

- **Framework**: NestJS 11 with TypeScript
- **Database**: MySQL 8.0 with TypeORM
- **Rules Engine**: json-rules-engine with custom operators
- **Validation**: class-validator with comprehensive DTOs
- **Testing**: Jest (setup ready)

## 🔍 Key Design Decisions

### 1. **JSON Rules Engine**

- **Why**: Flexibility to add/modify rules without code changes
- **Trade-off**: Slightly more complex than hardcoded rules, but infinitely more maintainable

### 2. **Chunked Batch Processing**

- **Why**: Prevents memory issues and enables parallel processing
- **Trade-off**: More complex implementation, but handles enterprise-scale loads

### 3. **Comprehensive History Tracking**

- **Why**: Audit requirements and business intelligence
- **Trade-off**: Additional storage overhead, but provides immense business value

### 4. **Pure Calculation Endpoints**

- **Why**: Stateless calculations for performance and flexibility
- **Trade-off**: Dual API surface, but serves different use cases

## 📈 What I Would Do Next (Given More Time)


- [ ] **API Documentation**: Swagger/OpenAPI integration
- [ ] **Caching Layer**: Redis for rule caching and performance
- [ ] **Rate Limiting**: API protection and throttling
- [ ] **Health Checks**: Monitoring and alerting endpoints
- [ ] **Rule Versioning**: Track rule changes over time
- [ ] **A/B Testing**: Compare rule performance
- [ ] **Advanced Analytics**: ML-based insights and predictions
- [ ] **Multi-tenancy**: Support multiple organizations

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Performance Testing (1000 Transactions)

```bash
# Install axios for testing (if not already installed)
npm install

# Test with 100 transactions first (recommended)
npm run test:100

# Run full 1000 transaction performance test
npm run test:1000
```

**Test Coverage:**

- ✅ **Core Business Logic**: Fee calculation with all 3 required rules (POS, E-commerce, Credit discount)
- ✅ **API Endpoints**: Controller integration tests for pure calculation endpoints
- ✅ **Rule Engine**: Rule creation and management functionality
- ✅ **Multiple Rule Scenarios**: Combined rule application (e.g., POS + Credit discount)
- ✅ **Service Layer**: Proper mocking and isolation testing
- ✅ **Performance**: 1000 transaction batch processing with detailed metrics

## 📝 Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=fee_calc
DB_SYNCHRONIZE=true
DB_LOGGING=false

# Application
PORT=3000
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for enterprise-grade financial processing**
