import { TConnectionLinkResponse } from '@clientfuse/models';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateConnectionLinkDto } from '../dto/create-connection-link.dto';
import { UpdateConnectionLinkDto } from '../dto/update-connection-link.dto';
import { ConnectionLink, ConnectionLinkDocument } from '../schemas/connection-link.schema';

@Injectable()
export class ConnectionLinkService {
  constructor(
    @InjectModel(ConnectionLink.name) private connectionLinkModel: Model<ConnectionLinkDocument>
  ) {}

  async createConnectionLink(dto: CreateConnectionLinkDto): Promise<TConnectionLinkResponse> {
    if (dto.isDefault) {
      await this.unsetDefaultForAgency(dto.agencyId);
    }

    const createdConnectionLink = await this.connectionLinkModel.create(dto);
    return createdConnectionLink.toJSON() as unknown as TConnectionLinkResponse;
  }

  async createDefaultConnectionLink(agencyId: string, data?: Partial<CreateConnectionLinkDto>): Promise<TConnectionLinkResponse> {
    await this.unsetDefaultForAgency(agencyId);

    const connectionLinkData: CreateConnectionLinkDto = {
      agencyId,
      isDefault: true,
      google: data?.google,
      facebook: data?.facebook
    };

    const createdConnectionLink = await this.connectionLinkModel.create(connectionLinkData);
    return createdConnectionLink.toJSON() as unknown as TConnectionLinkResponse;
  }

  async findConnectionLinks(filter: FilterQuery<ConnectionLinkDocument>): Promise<TConnectionLinkResponse[]> {
    const connectionLinks = await this.connectionLinkModel.find(filter).exec();
    return connectionLinks.map((link) => link.toJSON() as unknown as TConnectionLinkResponse);
  }

  async findConnectionLink(filter: FilterQuery<ConnectionLinkDocument>): Promise<TConnectionLinkResponse | null> {
    const connectionLink = await this.connectionLinkModel.findOne(filter);
    if (!connectionLink) return null;
    return connectionLink.toJSON() as unknown as TConnectionLinkResponse;
  }

  async findDefaultConnectionLink(agencyId: string): Promise<TConnectionLinkResponse | null> {
    return this.findConnectionLink({ agencyId, isDefault: true });
  }

  async updateConnectionLink(id: string, dto: UpdateConnectionLinkDto): Promise<TConnectionLinkResponse> {
    if (dto.isDefault && dto.agencyId) {
      await this.unsetDefaultForAgency(dto.agencyId);
    }

    await this.connectionLinkModel.findOneAndUpdate({ _id: id }, dto);
    const updatedConnectionLink = await this.findConnectionLink({ _id: id });

    if (!updatedConnectionLink) {
      throw new NotFoundException('Connection link not found after update');
    }

    return updatedConnectionLink;
  }

  async deleteConnectionLink(id: string): Promise<void> {
    const connectionLink = await this.findConnectionLink({ _id: id });

    if (!connectionLink) {
      throw new NotFoundException('Connection link not found');
    }

    if (connectionLink.isDefault) {
      throw new BadRequestException('Cannot delete default connection link');
    }

    await this.connectionLinkModel.deleteOne({ _id: id });
  }

  async setAsDefault(id: string): Promise<TConnectionLinkResponse> {
    const connectionLink = await this.findConnectionLink({ _id: id });

    if (!connectionLink) {
      throw new NotFoundException('Connection link not found');
    }

    await this.unsetDefaultForAgency(connectionLink.agencyId);

    await this.connectionLinkModel.updateOne(
      { _id: id },
      { $set: { isDefault: true } }
    );

    const updatedConnectionLink = await this.findConnectionLink({ _id: id });

    if (!updatedConnectionLink) {
      throw new NotFoundException('Connection link not found after update');
    }

    return updatedConnectionLink;
  }

  private async unsetDefaultForAgency(agencyId: string): Promise<void> {
    await this.connectionLinkModel.updateMany(
      { agencyId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }
}
