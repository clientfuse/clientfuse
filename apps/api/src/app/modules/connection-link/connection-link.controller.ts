import { ENDPOINTS, TConnectionLinkResponse, ServerErrorCode } from '@clientfuse/models';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
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

  @Get('default/:agencyId')
  async findDefault(@Param('agencyId') agencyId: string): Promise<TConnectionLinkResponse> {
    const connectionLink = await this.connectionLinkService.findDefaultConnectionLink(agencyId);
    if (!connectionLink) {
      throw new NotFoundException(ServerErrorCode.CONNECTION_LINK_NOT_FOUND);
    }
    return connectionLink;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TConnectionLinkResponse> {
    const connectionLink = await this.connectionLinkService.findConnectionLink({ _id: id });
    if (!connectionLink) {
      throw new NotFoundException(ServerErrorCode.CONNECTION_LINK_NOT_FOUND);
    }
    return connectionLink;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateConnectionLinkDto: UpdateConnectionLinkDto
  ): Promise<TConnectionLinkResponse> {
    return this.connectionLinkService.updateConnectionLink(id, updateConnectionLinkDto);
  }

  @Put(':id/set-default')
  async setAsDefault(@Param('id') id: string): Promise<TConnectionLinkResponse> {
    return this.connectionLinkService.setAsDefault(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.connectionLinkService.deleteConnectionLink(id);
  }
}
