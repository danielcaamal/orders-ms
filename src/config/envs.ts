import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
}

const envVarsSchema = joi
  .object({
    PORT: joi.number().default(3000),
    DATABASE_URL: joi.string().required(),
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
};
