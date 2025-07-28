# 🧪 API Test Samples

Complete collection of API requests to test all endpoints. Copy and paste these into Postman, Insomnia, or use curl commands.

## 🚀 Base URL

```
http://localhost:3000
```

---

## 💰 Fee Calculation Endpoints

### 1. Single Fee Calculation (Pure - No DB Persistence)

**Endpoint:** `POST /transactions/calculate-fee-pure`

#### Test Case 1: POS Transaction ≤ €100 (Rule #1 - Fixed Fee)

```json
{
  "transaction": {
    "type": "POS",
    "amount": 75.5,
    "currency": "EUR"
  },
  "client": {
    "name": "John Doe",
    "creditScore": 350,
    "segment": "standard",
    "email": "john.doe@example.com"
  }
}
```

**Expected:** €0.20 fixed fee

#### Test Case 2: POS Transaction > €100 (Rule #1 - Percentage Fee)

```json
{
  "transaction": {
    "type": "POS",
    "amount": 250.0,
    "currency": "EUR"
  },
  "client": {
    "name": "Jane Smith",
    "creditScore": 450,
    "segment": "premium",
    "email": "jane.smith@example.com"
  }
}
```

**Expected:** €0.50 (0.2% of €250) - €2.50 discount (1% of €250) = -€2.00

#### Test Case 3: E-commerce Transaction (Rule #2)

```json
{
  "transaction": {
    "type": "ECOMMERCE",
    "amount": 1000.0,
    "currency": "EUR"
  },
  "client": {
    "name": "Alice Johnson",
    "creditScore": 300,
    "segment": "standard",
    "email": "alice.johnson@example.com"
  }
}
```

**Expected:** €18.15 (1.8% of €1000 + €0.15)

#### Test Case 4: E-commerce with Credit Discount + Cap

```json
{
  "transaction": {
    "type": "ECOMMERCE",
    "amount": 10000.0,
    "currency": "EUR"
  },
  "client": {
    "name": "Bob Wilson",
    "creditScore": 500,
    "segment": "vip",
    "email": "bob.wilson@example.com"
  }
}
```

**Expected:** E-commerce fee (1.8% + €0.15, capped at €120) minus 1% transaction discount

#### Test Case 5: Large Transaction Surcharge

```json
{
  "transaction": {
    "type": "TRANSFER",
    "amount": 7500.0,
    "currency": "EUR"
  },
  "client": {
    "name": "Corporate Client",
    "creditScore": 600,
    "segment": "corporate",
    "email": "finance@company.com"
  }
}
```

**Expected:** €37.50 (0.5% surcharge) - €75.00 discount (1% of €7,500) = -€37.50

### 2. Batch Fee Calculation (Pure)

**Endpoint:** `POST /transactions/batch-calculate-fee-pure`

#### Test Case: Mixed Transaction Batch

```json
{
  "transactions": [
    {
      "transaction": {
        "type": "POS",
        "amount": 50.0,
        "currency": "EUR"
      },
      "client": {
        "name": "Customer 1",
        "creditScore": 300,
        "segment": "standard"
      }
    },
    {
      "transaction": {
        "type": "ECOMMERCE",
        "amount": 200.0,
        "currency": "EUR"
      },
      "client": {
        "name": "Customer 2",
        "creditScore": 450,
        "segment": "premium"
      }
    },
    {
      "transaction": {
        "type": "POS",
        "amount": 150.0,
        "currency": "EUR"
      },
      "client": {
        "name": "Customer 3",
        "creditScore": 500,
        "segment": "vip"
      }
    }
  ]
}
```

### 3. Fee Calculation with DB Persistence

**Endpoint:** `POST /transactions/calculate-fee`

Use the same JSON structures as above. This will create client and transaction records in the database.

---

## 📋 Rule Management Endpoints

### 1. Get All Rules

**Endpoint:** `GET /rules`

```bash
curl -X GET http://localhost:3000/rules
```

### 2. Get Specific Rule

**Endpoint:** `GET /rules/{id}`

```bash
curl -X GET http://localhost:3000/rules/1
```

### 3. Create New Rule

**Endpoint:** `POST /rules`

#### Example: Weekend Surcharge Rule

```json
{
  "name": "Weekend Surcharge",
  "description": "5% additional fee on weekends",
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
  "priority": 8,
  "isActive": true
}
```

#### Example: VIP Client Discount

```json
{
  "name": "VIP Client Discount",
  "description": "2% discount for VIP clients",
  "type": "ANY",
  "conditions": {
    "all": [
      {
        "fact": "client",
        "path": "$.segment",
        "operator": "equal",
        "value": "vip"
      }
    ]
  },
  "event": {
    "type": "calculate-fee",
    "params": {
      "feeType": "percentage",
      "percentage": -0.02
    }
  },
  "priority": 9,
  "isActive": true
}
```

#### Example: Business Hours Discount

```json
{
  "name": "Business Hours Discount",
  "description": "1% discount during business hours (9-17)",
  "type": "ANY",
  "conditions": {
    "all": [
      {
        "fact": "transaction",
        "path": "$.createdAt",
        "operator": "timeRange",
        "value": {
          "start": "09:00",
          "end": "17:00"
        }
      }
    ]
  },
  "event": {
    "type": "calculate-fee",
    "params": {
      "feeType": "percentage",
      "percentage": -0.01
    }
  },
  "priority": 7,
  "isActive": true
}
```

### 4. Update Rule

**Endpoint:** `PUT /rules/{id}`

```json
{
  "name": "Updated Rule Name",
  "description": "Updated description",
  "isActive": false
}
```

### 5. Toggle Rule Active/Inactive

**Endpoint:** `POST /rules/{id}/toggle`

```bash
curl -X POST http://localhost:3000/rules/1/toggle
```

### 6. Delete Rule

**Endpoint:** `DELETE /rules/{id}`

```bash
curl -X DELETE http://localhost:3000/rules/1
```

---

## 📊 History & Analytics Endpoints

### 1. Get Calculation History

**Endpoint:** `GET /history`

#### Basic Query

```bash
curl -X GET "http://localhost:3000/history?limit=10&offset=0"
```

#### Filtered Query

```bash
curl -X GET "http://localhost:3000/history?transactionType=POS&limit=20&sortBy=calculatedAt&sortOrder=DESC"
```

#### Date Range Query

```bash
curl -X GET "http://localhost:3000/history?startDate=2024-01-01&endDate=2024-12-31&limit=50"
```

### 2. Get Analytics Dashboard

**Endpoint:** `GET /history/stats`

#### Overall Stats

```bash
curl -X GET http://localhost:3000/history/stats
```

#### Date Range Stats

```bash
curl -X GET "http://localhost:3000/history/stats?startDate=2024-01-01&endDate=2024-12-31"
```

### 3. Get Transaction History

**Endpoint:** `GET /history/transaction/{transactionId}`

```bash
curl -X GET http://localhost:3000/history/transaction/123e4567-e89b-12d3-a456-426614174000
```

### 4. Get Client History

**Endpoint:** `GET /history/client/{clientId}`

```bash
curl -X GET "http://localhost:3000/history/client/123e4567-e89b-12d3-a456-426614174000?limit=20"
```

### 5. Get Batch History

**Endpoint:** `GET /history/batch/{batchId}`

```bash
curl -X GET http://localhost:3000/history/batch/batch_1640995200000_abc123def
```

### 6. Cleanup Old History older than {days}

**Endpoint:** `DELETE /history/cleanup/{days}`

```bash
curl -X DELETE http://localhost:3000/history/cleanup/90
```

---

## 👥 Client Management Endpoints

### 1. Create Client

**Endpoint:** `POST /clients`

```json
{
  "name": "Test Client",
  "creditScore": 450,
  "segment": "premium",
  "email": "test@example.com"
}
```

### 2. Get All Clients

**Endpoint:** `GET /clients`

```bash
curl -X GET http://localhost:3000/clients
```

### 3. Get Client by ID

**Endpoint:** `GET /clients/{id}`

```bash
curl -X GET http://localhost:3000/clients/123e4567-e89b-12d3-a456-426614174000
```

### 4. Update Client

**Endpoint:** `PUT /clients/{id}`

```json
{
  "name": "Updated Client Name",
  "creditScore": 500,
  "segment": "vip"
}
```

### 5. Delete Client

**Endpoint:** `DELETE /clients/{id}`

```bash
curl -X DELETE http://localhost:3000/clients/123e4567-e89b-12d3-a456-426614174000
```

---

## 💳 Transaction Management Endpoints

### 1. Create Transaction

**Endpoint:** `POST /transactions`

```json
{
  "type": "POS",
  "amount": 125.5,
  "currency": "EUR",
  "clientId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 2. Get All Transactions

**Endpoint:** `GET /transactions`

```bash
curl -X GET http://localhost:3000/transactions
```

### 3. Get Transaction by ID

**Endpoint:** `GET /transactions/{id}`

```bash
curl -X GET http://localhost:3000/transactions/123e4567-e89b-12d3-a456-426614174000
```

---

## 🧪 Testing Scenarios

### Scenario 1: Test All Three Required Rules

1. Run POS ≤ €100 test (should get €0.20 fee)
2. Run POS > €100 test (should get 0.2% fee)
3. Run E-commerce test (should get 1.8% + €0.15)
4. Run high credit score test (should get 1% discount)

### Scenario 2: Test Batch Processing

1. Create a batch with 10 mixed transactions
2. Observe processing time and success rate
3. Check that it processes efficiently

### Scenario 3: Test Rule Management

1. Create a new rule via API
2. Test fee calculation (should apply new rule)
3. Disable the rule
4. Test again (rule should not apply)

### Scenario 4: Test Analytics

1. Run several calculations
2. Check history endpoint
3. View analytics dashboard
4. Verify all data is tracked correctly

---

## 🔧 cURL Commands for Quick Testing

### Quick Rule Test

```bash
# Test POS transaction ≤ €100
curl -X POST http://localhost:3000/transactions/calculate-fee-pure \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {"type": "POS", "amount": 75, "currency": "EUR"},
    "client": {"name": "Test", "creditScore": 300, "segment": "standard"}
  }'

# Test E-commerce transaction
curl -X POST http://localhost:3000/transactions/calculate-fee-pure \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {"type": "ECOMMERCE", "amount": 500, "currency": "EUR"},
    "client": {"name": "Test", "creditScore": 450, "segment": "premium"}
  }'
```

### Quick Analytics Check

```bash
# Get current stats
curl -X GET http://localhost:3000/history/stats

# Get recent history
curl -X GET "http://localhost:3000/history?limit=5"
```

---

**💡 Pro Tip:** Start with the pure calculation endpoints to test the core logic, then move to rule management to see the flexibility, and finish with analytics to see the comprehensive tracking!
