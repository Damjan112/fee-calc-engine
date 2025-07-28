const axios = require('axios');

// Configuration - Smaller batch for initial testing
const BASE_URL = 'http://localhost:3000';
const BATCH_SIZE = 100;

// Transaction types and their probabilities
const TRANSACTION_TYPES = ['POS', 'ECOMMERCE', 'TRANSFER', 'ATM', 'ONLINE'];
const CLIENT_SEGMENTS = ['standard', 'premium', 'vip', 'corporate'];

// Helper function to generate random data
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAmount(min = 10, max = 10000) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getRandomCreditScore() {
  // Generate credit scores with some having > 400 for discount testing
  const scores = [250, 300, 350, 420, 450, 500, 550, 600, 650, 700];
  return getRandomElement(scores);
}

function generateRandomTransaction() {
  return {
    transaction: {
      type: getRandomElement(TRANSACTION_TYPES),
      amount: getRandomAmount(),
      currency: 'EUR'
    },
    client: {
      name: `Client ${Math.floor(Math.random() * 10000)}`,
      creditScore: getRandomCreditScore(),
      segment: getRandomElement(CLIENT_SEGMENTS),
      email: `client${Math.floor(Math.random() * 10000)}@example.com`
    }
  };
}

function generateBatchRequest(size) {
  const transactions = [];
  for (let i = 0; i < size; i++) {
    transactions.push(generateRandomTransaction());
  }
  return { transactions };
}

async function testBatchCalculation() {
  console.log(`🚀 Starting ${BATCH_SIZE} Transaction Batch Test`);
  console.log('=====================================');
  console.log('');

  try {
    // Generate transactions
    console.log(`📊 Generating ${BATCH_SIZE} random transactions...`);
    const batchRequest = generateBatchRequest(BATCH_SIZE);
    
    console.log('📋 Sample transactions:');
    batchRequest.transactions.slice(0, 3).forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx.transaction.type} €${tx.transaction.amount} (Credit: ${tx.client.creditScore})`);
    });
    console.log(`   ... and ${BATCH_SIZE - 3} more`);
    console.log('');

    // Send batch request
    console.log('⏱️  Sending batch calculation request...');
    const startTime = Date.now();
    
    const response = await axios.post(
      `${BASE_URL}/transactions/batch-calculate-fee-pure`,
      batchRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Display results
    console.log('✅ Batch calculation completed!');
    console.log('');
    console.log('📊 PERFORMANCE RESULTS:');
    console.log('========================');
    console.log(`🔢 Total Transactions: ${BATCH_SIZE}`);
    console.log(`✅ Processed Successfully: ${response.data.processedTransactions}`);
    console.log(`❌ Failed: ${response.data.failedTransactions}`);
    console.log(`📈 Success Rate: ${response.data.successRate}%`);
    console.log('');
    console.log('⏱️  TIMING ANALYSIS:');
    console.log('===================');
    console.log(`🕐 Total Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`🕐 Server Processing Time: ${response.data.totalTime}ms`);
    console.log(`⚡ Average per Transaction: ${response.data.averageProcessingTime.toFixed(2)}ms`);
    console.log(`🚀 Throughput: ${(BATCH_SIZE / (response.data.totalTime / 1000)).toFixed(0)} transactions/second`);
    console.log('');
    console.log('💰 FINANCIAL SUMMARY:');
    console.log('=====================');
    console.log(`💵 Total Transaction Amount: €${response.data.totalAmount.toLocaleString()}`);
    console.log(`💸 Total Fees Calculated: €${response.data.totalFee.toLocaleString()}`);
    console.log(`📊 Average Fee: €${(response.data.totalFee / response.data.processedTransactions).toFixed(2)}`);
    console.log('');

    console.log('🎉 Test completed successfully!');
    console.log('');
    console.log('🚀 Ready for 1000 transaction test!');
    console.log('   Run: npm run test:1000');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('🌐 No response received. Is the server running?');
      console.error('💡 Make sure to start the server with: npm run start:dev');
    }
    
    process.exit(1);
  }
}

// Check if server is running first
async function checkServerHealth() {
  try {
    console.log('🔍 Checking if server is running...');
    await axios.get(`${BASE_URL}/rules`);
    console.log('✅ Server is running and responsive');
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Server is not running or not responsive');
    console.error('💡 Please start the server first with: npm run start:dev');
    console.error('💡 Make sure the server is running on http://localhost:3000');
    return false;
  }
}

// Main execution
async function main() {
  console.log(`🧪 Fee Calculation Engine - ${BATCH_SIZE} Transaction Performance Test`);
  console.log('==============================================================');
  console.log('');
  
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await testBatchCalculation();
}

// Run the test
main().catch(console.error);