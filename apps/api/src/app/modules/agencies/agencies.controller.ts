import { ENDPOINTS, IAgencyBase, IAgencyResponse, ServerErrorCode } from '@connectly/models';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';

@Controller(ENDPOINTS.agencies.root)
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {
  }

  @Post()
  async create(@Body() createAgencyDto: CreateAgencyDto): Promise<IAgencyResponse> {
    return this.agenciesService.createAgency(createAgencyDto);
  }

  @Get()
  async findAll(@Query() query: Partial<IAgencyBase>): Promise<IAgencyResponse[]> {
    return this.agenciesService.findAgencies(query);
  }

  @Get(ENDPOINTS.agencies.getOne)
  async findOne(@Param('id') id: string): Promise<IAgencyResponse> {
    const agency = this.agenciesService.findAgency({ _id: id });
    if (!agency) throw new NotFoundException(ServerErrorCode.AGENCY_NOT_FOUND);
    return agency;
  }

  @Put(ENDPOINTS.agencies.editOne)
  async update(
    @Param('id') id: string,
    @Body() updateAgencyDto: UpdateAgencyDto
  ): Promise<IAgencyResponse> {
    return this.agenciesService.updateAgency(id, updateAgencyDto);
  }

  @Delete(ENDPOINTS.agencies.deleteOne)
  async remove(@Param('id') id: string): Promise<null> {
    return this.agenciesService.removeAgency(id);
  }
}
