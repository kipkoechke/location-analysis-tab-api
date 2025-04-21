import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();
const isDevelopment = process.env.NODE_ENV !== 'production';

export default new DataSource({
  type: 'postgres',
  host: configService.get('POSTGRES_HOST'),
  port: configService.get('POSTGRES_PORT'),
  database: configService.get('POSTGRES_DATABASE'),
  username: configService.get('POSTGRES_USER'),
  password: configService.get('POSTGRES_PASSWORD'),
  entities: [`${process.cwd()}/dist/src/modules/**/entities/*.entity.js`],
  migrations: [`${process.cwd()}/dist/src/migrations/*.js`],
});
