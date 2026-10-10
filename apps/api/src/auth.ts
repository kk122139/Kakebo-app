import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, transaction, event } from "./db";
import { RegisterDto, LoginDto, TokenDto } from "./dto";
export const secret = () => process.env.JWT_SECRET!;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export async function session(userId: string, c: any) {
  const refreshToken = randomBytes(48).toString("hex");
  await c.query(
    "INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '30 days')",
    [randomUUID(), userId, hash(refreshToken)],
  );
  return {
    accessToken: jwt.sign({ sub: userId }, secret(), {
      expiresIn: "15m",
      issuer: "kakebo",
      audience: "kakebo-mobile",
    }),
    refreshToken,
  };
}
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    try {
      const token = req.headers.authorization?.split(" ");
      if (token?.[0] !== "Bearer") throw Error();
      const data = jwt.verify(token[1], secret(), {
        algorithms: ["HS256"],
        issuer: "kakebo",
        audience: "kakebo-mobile",
      });
      if (typeof data === "string" || !data.sub) throw Error();
      req.userId = data.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Sesión inválida o expirada");
    }
  }
}
@ApiTags("Autenticación")
@Controller("auth")
export class AuthController {
  @Post("register") async register(@Body() dto: RegisterDto) {
    const password = await bcrypt.hash(dto.password, 12);
    return transaction(async (c) => {
      const id = randomUUID();
      try {
        await c.query(
          "INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,$4)",
          [id, dto.email.trim().toLowerCase(), dto.name, password],
        );
      } catch (e: any) {
        if (e.code === "23505")
          throw new (await import("@nestjs/common")).ConflictException(
            "El correo ya está registrado",
          );
        throw e;
      }
      await event(c, id, "account.created", {});
      return session(id, c);
    });
  }
  @Post("login") async login(@Body() dto: LoginDto) {
    const { rows } = await db.query("SELECT * FROM users WHERE email=$1", [
      dto.email.trim().toLowerCase(),
    ]);
    if (
      !rows[0] ||
      !(await bcrypt.compare(dto.password, rows[0].password_hash))
    )
      throw new UnauthorizedException("Correo o contraseña incorrectos");
    return transaction((c) => session(rows[0].id, c));
  }
  @Post("refresh") async refresh(@Body() dto: TokenDto) {
    return transaction(async (c) => {
      const { rows } = await c.query(
        "DELETE FROM sessions WHERE token_hash=$1 AND expires_at>now() RETURNING user_id",
        [hash(dto.refreshToken)],
      );
      if (!rows[0]) throw new UnauthorizedException("Vuelve a iniciar sesión");
      return session(rows[0].user_id, c);
    });
  }
  @Post("logout") async logout(@Body() dto: TokenDto) {
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [
      hash(dto.refreshToken),
    ]);
    return { ok: true };
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Get("me") async me(@Req() req: any) {
    return (
      await db.query("SELECT id,email,name,objective FROM users WHERE id=$1", [
        req.userId,
      ])
    ).rows[0];
  }
}
