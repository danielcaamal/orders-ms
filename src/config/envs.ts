import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  PRODUCTS_MS_HOST: string;
  PRODUCTS_MS_PORT: number;
}

const envVarsSchema = joi
  .object({
    PORT: joi.number().default(3000),
    DATABASE_URL: joi.string().required(),
    PRODUCTS_MS_HOST: joi.string().required(),
    PRODUCTS_MS_PORT: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config: EnvVars = value;

export const envs = {
  PORT: config.PORT,
  DATABASE_URL: config.DATABASE_URL,
  PRODUCTS_MS_HOST: config.PRODUCTS_MS_HOST,
  PRODUCTS_MS_PORT: config.PRODUCTS_MS_PORT,
};
