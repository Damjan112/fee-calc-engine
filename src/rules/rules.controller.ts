import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RuleService } from './rule.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { FeeRule } from './rule.entity';

@Controller('rules')
export class RulesController {
  constructor(private readonly ruleService: RuleService) {}

  @Get()
  async getAllRules(): Promise<FeeRule[]> {
    return this.ruleService.getAllRules();
  }

  @Get(':id')
  async getRuleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FeeRule | null> {
    return this.ruleService.getRuleById(id);
  }

  @Post()
  async createRule(@Body() createRuleDto: CreateRuleDto): Promise<FeeRule> {
    return this.ruleService.createRule(createRuleDto);
  }

  @Put(':id')
  async updateRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRuleDto: Partial<CreateRuleDto>,
  ): Promise<FeeRule | null> {
    return this.ruleService.updateRule(id, updateRuleDto);
  }

  @Delete(':id')
  async deleteRule(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    const success = await this.ruleService.deleteRule(id);
    return { success };
  }

  @Post(':id/toggle')
  async toggleRule(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FeeRule | null> {
    return this.ruleService.toggleRule(id);
  }
}
