import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RuleService } from '../rules/rule.service';
import { initialRules } from './seeds/rule-seed';

async function seedRules() {
  console.log('🌱 Starting rule seeding...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const ruleService = app.get(RuleService);

  try {
    // Get existing rules to avoid duplicates
    const existingRules = await ruleService.getAllRules();
    console.log(`📋 Found ${existingRules.length} existing rules`);

    let seededCount = 0;
    let skippedCount = 0;

    for (const ruleData of initialRules) {
      // Check if rule already exists by name
      const existingRule = existingRules.find(r => r.name === ruleData.name);
      
      if (existingRule) {
        console.log(`⏭️  Skipping existing rule: ${ruleData.name}`);
        skippedCount++;
        continue;
      }

      try {
        await ruleService.createRule(ruleData as any);
        console.log(`✅ Created rule: ${ruleData.name}`);
        seededCount++;
      } catch (error) {
        console.error(`❌ Failed to create rule ${ruleData.name}:`, error.message);
      }
    }

    console.log('\n🎉 Rule seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   • Created: ${seededCount} rules`);
    console.log(`   • Skipped: ${skippedCount} rules (already exist)`);
    console.log(`   • Total: ${seededCount + skippedCount + existingRules.length - skippedCount} rules in database`);

    // Display the rules that are now active
    const allRules = await ruleService.getAllRules();
    console.log('\n📋 Active Rules:');
    allRules
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority)
      .forEach(rule => {
        console.log(`   ${rule.priority}. ${rule.name} - ${rule.description}`);
      });

  } catch (error) {
    console.error('❌ Rule seeding failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the seeding
seedRules()
  .then(() => {
    console.log('\n✨ All done! Your fee calculation engine is ready to use.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });