import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleService } from './rule.service';
import { RulesController } from './rules.controller';
import { FeeRule } from './rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeRule])],
  providers: [RuleService],
  controllers: [RulesController],
  exports: [RuleService],
})
export class RulesModule {}
