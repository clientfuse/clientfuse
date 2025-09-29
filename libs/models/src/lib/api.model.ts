import { HttpStatus } from '@nestjs/common';
import { ServerErrorCode } from './message.model';

export interface IResponse<PAYLOAD> {
  statusCode: HttpStatus;
  payload: PAYLOAD;
}

export interface IRequest<PAYLOAD> {
  payload: PAYLOAD;
}

export interface IErrorResponse {
  statusCode: HttpStatus;
  message: ServerErrorCode;
  error: string;
}

export interface IFindOptions {
  limit?: string;
  skip?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export enum AppHeaders {
  AUTHORIZATION = 'Authorization'
}
