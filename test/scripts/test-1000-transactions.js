const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const BATCH_SIZE = 1000;

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
  console.log('🚀 Starting 1000 Transaction Batch Test');
  console.log('=====================================');
  console.log('');

  try {
    // Generate 1000 transactions
    console.log('📊 Generating 1000 random transactions...');
    const batchRequest = generateBatchRequest(BATCH_SIZE);
    
    console.log('📋 Sample transactions:');
    batchRequest.transactions.slice(0, 3).forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx.transaction.type} €${tx.transaction.amount} (Credit: ${tx.client.creditScore})`);
    });
    console.log('   ... and 997 more');
    console.log('');

    // Send batch request
    console.log('⏱️  Sending batch calculation request...');
    const startTime = Date.now();
    
    const response = await axios.post(
      `${BASE_URL}/transactions/batch-calculate-fee`,
      batchRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
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

    // Performance assessment
    const throughput = BATCH_SIZE / (response.data.totalTime / 1000);
    console.log('🎯 PERFORMANCE ASSESSMENT:');
    console.log('==========================');
    
    if (throughput > 100) {
      console.log('🏆 EXCELLENT: > 100 tx/sec - Production ready!');
    } else if (throughput > 50) {
      console.log('✅ GOOD: > 50 tx/sec - Meets requirements');
    } else if (throughput > 20) {
      console.log('⚠️  ACCEPTABLE: > 20 tx/sec - Could be optimized');
    } else {
      console.log('❌ NEEDS IMPROVEMENT: < 20 tx/sec');
    }

    // Scaling analysis
    const linearTime = BATCH_SIZE * response.data.averageProcessingTime;
    const actualTime = response.data.totalTime;
    const efficiency = ((linearTime - actualTime) / linearTime * 100);
    
    console.log('');
    console.log('📈 SCALING ANALYSIS:');
    console.log('====================');
    console.log(`🔄 Linear Processing Would Take: ${linearTime.toFixed(0)}ms`);
    console.log(`⚡ Actual Processing Time: ${actualTime}ms`);
    console.log(`🎯 Efficiency Gain: ${efficiency.toFixed(1)}% faster than linear`);
    
    if (efficiency > 80) {
      console.log('🏆 EXCELLENT: Highly optimized batch processing!');
    } else if (efficiency > 50) {
      console.log('✅ GOOD: Well-optimized batch processing');
    } else if (efficiency > 20) {
      console.log('⚠️  ACCEPTABLE: Some optimization present');
    } else {
      console.log('❌ POOR: Nearly linear scaling - needs optimization');
    }

    // Error analysis
    if (response.data.errors && response.data.errors.length > 0) {
      console.log('');
      console.log('⚠️  ERRORS ENCOUNTERED:');
      console.log('======================');
      response.data.errors.slice(0, 5).forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      if (response.data.errors.length > 5) {
        console.log(`   ... and ${response.data.errors.length - 5} more errors`);
      }
    }

    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log('');
    console.log('💡 TIP: Check the history endpoint to see all calculations:');
    console.log(`   GET ${BASE_URL}/history/stats`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 413) {
        console.error('');
        console.error('💡 SOLUTION: Request payload too large');
        console.error('   The server needs to be restarted after increasing body size limit.');
        console.error('   1. Stop the server (Ctrl+C)');
        console.error('   2. Restart with: npm run start:dev');
        console.error('   3. Run the test again: npm run test:1000');
        console.error('');
        console.error('   Alternative: Test with smaller batch first:');
        console.error('   - Modify BATCH_SIZE in test-1000-transactions.js to 100');
      }
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
  console.log('🧪 Fee Calculation Engine - 1000 Transaction Performance Test');
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