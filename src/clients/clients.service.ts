import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async create(input: CreateClientDto): Promise<Client> {
    const client = this.clientsRepository.create(input);
    return this.clientsRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return this.clientsRepository.find();
  }

  async findById(id: string): Promise<Client | null> {
    return this.clientsRepository.findOne({ where: { id } });
  }

  async update(id: string, input: CreateClientDto): Promise<Client | null> {
    const client = await this.findById(id);
    if (!client) {
      return null;
    }
    return this.clientsRepository.save({ ...client, ...input });
  }

  async delete(id: string): Promise<void> {
    await this.clientsRepository.delete(id);
  }
}
