import { AppHeaders, IJwtPayload, ServerErrorCode } from '@connectly/models';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { catchError, from, Observable, of, switchMap } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
  ) {
  }

  canActivate(context: ExecutionContext): Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(ServerErrorCode.TOKEN_NOT_FOUND);
    }

    return from(this.jwtService.verifyAsync(token, {secret: this.configService.get('JWT_SECRET')}))
      .pipe(
        switchMap((result: IJwtPayload) => {
          request['user'] = result.sub;
          return of(true);
        }),
        catchError(() => {
          throw new UnauthorizedException(ServerErrorCode.TOKEN_IS_INVALID);
        })
      );
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers[AppHeaders.AUTHORIZATION.toLowerCase()]?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
