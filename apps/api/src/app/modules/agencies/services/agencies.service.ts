import { IAgencyBase, IAgencyResponse, IFileUpload, IS3UploadResult } from '@clientfuse/models';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { EventType, IAgencyCreatedEvent } from '../../../core/modules/event-bus/event-bus.model';
import { EventBusService } from '../../../core/modules/event-bus/event-bus.service';
import { S3Service } from '../../../core/modules/aws/s3.service';
import { processImageSimple } from '../../../core/utils/image';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { UpdateAgencyDto } from '../dto/update-agency.dto';
import { Agency, AgencyDocument } from '../schemas/agencies.schema';

@Injectable()
export class AgenciesService {

  constructor(
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    private eventBusService: EventBusService,
    private awsService: S3Service
  ) {
  }

  async createAgency(agency: CreateAgencyDto, correlationId?: string): Promise<IAgencyResponse> {
    const newAgency: IAgencyBase = { ...agency };
    const createdAgency = await this.agencyModel.create(newAgency);
    const agencyResponse = createdAgency.toJSON() as unknown as IAgencyResponse;

    await this.eventBusService.emitAsync<IAgencyCreatedEvent>(
      EventType.AGENCY_CREATED,
      { agencyId: agencyResponse._id, userId: agencyResponse.userId },
      AgenciesService.name,
      correlationId
    );

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

  async uploadAgencyLogo(
    id: string,
    file: any
  ): Promise<IS3UploadResult> {
    const fileUpload: IFileUpload = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    };

    if (!this.awsService.validateImageFile(fileUpload)) {
      throw new BadRequestException('Invalid image file');
    }

    const processedBuffer = await processImageSimple(fileUpload.buffer, 500, 75);
    fileUpload.buffer = processedBuffer;
    fileUpload.size = processedBuffer.length;

    const uploadResult = await this.awsService.uploadFile(
      fileUpload,
      'agency-logos'
    );

    await this.agencyModel.findOneAndUpdate(
      { _id: id },
      { 'whiteLabeling.agencyLogo': uploadResult.url }
    );

    return uploadResult;
  }

  async deleteAgencyLogo(id: string): Promise<IAgencyResponse> {
    const agency = await this.findAgency({ _id: id });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    if (agency.whiteLabeling?.agencyLogo) {
      const key = this.extractS3KeyFromUrl(agency.whiteLabeling.agencyLogo);
      if (key) {
        await this.awsService.deleteFile(key);
      }
    }

    await this.agencyModel.findOneAndUpdate(
      { _id: id },
      { 'whiteLabeling.agencyLogo': null }
    );

    return this.findAgency({ _id: id });
  }

  private extractS3KeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.startsWith('/') ? pathname.substring(1) : pathname;
    } catch {
      return null;
    }
  }
}
