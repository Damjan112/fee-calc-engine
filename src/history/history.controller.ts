import {
  Controller,
  Get,
  Query,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoryStatsDto } from './dto/history-stats.dto';
import { FeeCalculationHistory } from './history.entity';
import { HistorySortField, SortOrder } from '../common/enums';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory(@Query() query: HistoryQueryDto): Promise<{
    data: FeeCalculationHistory[];
    total: number;
    page: number;
    totalPages: number;
    query: HistoryQueryDto;
  }> {
    const result = await this.historyService.getHistory(query);
    return {
      ...result,
      query,
    };
  }

  @Get('stats')
  async getHistoryStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<HistoryStatsDto> {
    return await this.historyService.getHistoryStats(startDate, endDate);
  }

  @Get('transaction/:transactionId')
  async getTransactionHistory(
    @Param('transactionId') transactionId: string,
  ): Promise<FeeCalculationHistory[]> {
    const result = await this.historyService.getHistory({
      transactionId,
      limit: 100,
      offset: 0,
      sortBy: HistorySortField.CALCULATED_AT,
      sortOrder: SortOrder.DESC,
    });
    return result.data;
  }

  @Get('client/:clientId')
  async getClientHistory(
    @Param('clientId') clientId: string,
    @Query() query: Partial<HistoryQueryDto>,
  ): Promise<{
    data: FeeCalculationHistory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await this.historyService.getHistory({
      ...query,
      clientId,
      limit: query.limit || 50,
      offset: query.offset || 0,
      sortBy: query.sortBy || HistorySortField.CALCULATED_AT,
      sortOrder: query.sortOrder || SortOrder.DESC,
    });
  }

  @Get('batch/:batchId')
  async getBatchHistory(
    @Param('batchId') batchId: string,
  ): Promise<FeeCalculationHistory[]> {
    const result = await this.historyService.getHistory({
      batchId,
      limit: 100,
      offset: 0,
      sortBy: HistorySortField.CALCULATED_AT,
      sortOrder: SortOrder.DESC,
    });
    return result.data;
  }

  @Delete('cleanup/:days')
  async cleanupOldHistory(
    @Param('days', ParseIntPipe) days: number,
  ): Promise<{ deletedRecords: number; message: string }> {
    const deletedRecords = await this.historyService.deleteOldHistory(days);
    return {
      deletedRecords,
      message: `Deleted ${deletedRecords} history records older than ${days} days`,
    };
  }
}
