import { IResponse } from '@connectly/models';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformResponse<T> implements NestInterceptor<T, IResponse<T>> {

  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    return next
      .handle()
      .pipe(
        map(data => ({
          payload: data,
          statusCode: context.switchToHttp().getResponse().statusCode
        }))
      );
  }

}
