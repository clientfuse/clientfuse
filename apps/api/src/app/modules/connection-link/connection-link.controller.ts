import { ENDPOINTS, ServerErrorCode, TConnectionLinkResponse } from '@clientfuse/models';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/is-public.decorator';
import { CreateConnectionLinkDto } from './dto/create-connection-link.dto';
import { UpdateConnectionLinkDto } from './dto/update-connection-link.dto';
import { ConnectionLinkService } from './services/connection-link.service';

@Controller(ENDPOINTS.connectionLinks.root)
export class ConnectionLinkController {
  constructor(private readonly connectionLinkService: ConnectionLinkService) {
  }

  @Post()
  async create(@Body() createConnectionLinkDto: CreateConnectionLinkDto): Promise<TConnectionLinkResponse> {
    return this.connectionLinkService.createConnectionLink(createConnectionLinkDto);
  }

  @Get()
  async findAll(@Query('agencyId') agencyId?: string): Promise<TConnectionLinkResponse[]> {
    const filter = agencyId ? { agencyId } : {};
    return this.connectionLinkService.findConnectionLinks(filter);
  }

  @Get(ENDPOINTS.connectionLinks.defaultByAgency)
  async findDefault(@Param('agencyId') agencyId: string): Promise<TConnectionLinkResponse> {
    const connectionLink = await this.connectionLinkService.findDefaultConnectionLink(agencyId);
    if (!connectionLink) {
      throw new NotFoundException(ServerErrorCode.CONNECTION_LINK_NOT_FOUND);
    }
    return connectionLink;
  }

  @Public()
  @Get(ENDPOINTS.connectionLinks.getOne)
  async findOne(@Param('id') id: string): Promise<TConnectionLinkResponse> {
    const connectionLink = await this.connectionLinkService.findConnectionLink({ _id: id });
    if (!connectionLink) {
      throw new NotFoundException(ServerErrorCode.CONNECTION_LINK_NOT_FOUND);
    }
    return connectionLink;
  }

  @Put(ENDPOINTS.connectionLinks.editOne)
  async update(
    @Param('id') id: string,
    @Body() updateConnectionLinkDto: UpdateConnectionLinkDto
  ): Promise<TConnectionLinkResponse> {
    return this.connectionLinkService.updateConnectionLink(id, updateConnectionLinkDto);
  }

  @Put(ENDPOINTS.connectionLinks.setDefault)
  async setAsDefault(@Param('id') id: string): Promise<TConnectionLinkResponse> {
    return this.connectionLinkService.setAsDefault(id);
  }

  @Delete(ENDPOINTS.connectionLinks.deleteOne)
  async remove(@Param('id') id: string): Promise<void> {
    return this.connectionLinkService.deleteConnectionLink(id);
  }
}
