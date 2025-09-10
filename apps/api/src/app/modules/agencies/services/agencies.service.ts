import { IAgencyBase, IAgencyResponse } from '@clientfuse/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ConnectionLinkService } from '../../connection-link/services/connection-link.service';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { UpdateAgencyDto } from '../dto/update-agency.dto';
import { Agency, AgencyDocument } from '../schemas/agencies.schema';

@Injectable()
export class AgenciesService {

  constructor(
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    private connectionLinkService: ConnectionLinkService
  ) {
  }

  async createAgency(agency: CreateAgencyDto): Promise<IAgencyResponse> {
    const newAgency: IAgencyBase = { ...agency };
    const createdAgency = await this.agencyModel.create(newAgency);
    const agencyResponse = createdAgency.toJSON() as unknown as IAgencyResponse;

    await this.connectionLinkService.createDefaultConnectionLink(agencyResponse._id);

    return agencyResponse;
  }

  async findAgencies(partial: FilterQuery<AgencyDocument>): Promise<IAgencyResponse[]> {
    const agencies = await this.agencyModel.find(partial).exec();
    return agencies.map((agency) => {
      return agency.toJSON() as unknown as IAgencyResponse;
    });
  }

  async findAgency(
    partial: FilterQuery<AgencyDocument>
  ): Promise<IAgencyResponse | null> {
    const agency = await this.agencyModel.findOne(partial);
    if (!agency) return null;
    return agency.toJSON() as unknown as IAgencyResponse;
  }

  async updateAgency(
    id: string,
    updateAgencyDto: UpdateAgencyDto
  ): Promise<IAgencyResponse> {
    await this.agencyModel.findOneAndUpdate({ _id: id }, updateAgencyDto);
    const updatedAgency = await this.findAgency({ _id: id });

    if (!updatedAgency) {
      throw new Error('Agency not found after update');
    }

    return updatedAgency;
  }

  async removeAgency(id: string): Promise<null> {
    await this.agencyModel.deleteOne({ _id: id });
    return null;
  }
}
