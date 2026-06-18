import { plainToInstance } from "class-transformer";
import { IsString, IsNumber, IsOptional, validateSync, Min, IsUrl } from "class-validator";

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @Min(1)
  REDIS_PORT: number;

  @IsString()
  INTERNAL_WORKER_SECRET: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  SENTRY_DSN?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors.map((e) => Object.values(e.constraints ?? {}).join(", ")).join("\n");
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return validatedConfig;
}