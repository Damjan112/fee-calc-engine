import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.clientsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.clientsService.delete(id);
  }
}
