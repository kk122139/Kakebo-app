import "reflect-metadata";
import "dotenv/config";
import { Module, Controller, Get, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { AuthController, AuthGuard } from "./auth";
import { FinanceController } from "./finance.controller";
import { db, startAudit } from "./db";
@Controller("health")
class HealthController {
  @Get() async health() {
    await db.query("SELECT 1");
    return { ok: true };
  }
}
@Module({
  controllers: [AuthController, FinanceController, HealthController],
  providers: [AuthGuard],
})
class AppModule {}
async function bootstrap() {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.startsWith("replace_")
  )
    throw new Error(
      "Configura JWT_SECRET con 32 caracteres aleatorios como mínimo",
    );
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use("/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const spec = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Kakebo MVP")
      .setVersion("0.1")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("docs", app, spec);
  const stopAudit = await startAudit();
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, async () => {
      await app.close();
      await stopAudit();
      await db.end();
      process.exit(0);
    });
}
bootstrap().catch(() => {
  console.error(
    "No se pudo iniciar API: revisa .env, migración y bases de datos.",
  );
  process.exit(1);
});
