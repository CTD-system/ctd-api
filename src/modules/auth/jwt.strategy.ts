import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          if (!req || !req.headers || !req.headers.authorization) return null;

          const auth = req.headers.authorization;

          // ✅ Soporta tokens con o sin "Bearer"
          if (auth.startsWith('Bearer ')) {
            return auth.slice(7).trim();
          }
          return auth.trim();
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'superSecretClaveJWT',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) return null;
    return user;
  }
}
