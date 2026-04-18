import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { CognitoUser } from '../interfaces/cognito-user.interface';

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(
  Strategy,
  'cognito-jwt',
) {
  constructor(configService: ConfigService) {
    const region = configService.get<string>('aws.region');
    const userPoolId = configService.get<string>('cognito.userPoolId');
    const clientId = configService.get<string>('cognito.clientId');
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}/.well-known/jwks.json`,
      }),
    });

    this.clientId = clientId!;
  }

  private readonly clientId: string;

  validate(payload: any): CognitoUser {
    if (payload.token_use !== 'access' || payload.client_id !== this.clientId) {
      throw new Error('Invalid token');
    }

    return {
      sub: payload.sub,
      username: payload.username,
      groups: payload['cognito:groups'] ?? [],
      clientId: payload.client_id,
    };
  }
}
