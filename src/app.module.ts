import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT! || 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const host = process.env.MONGO_HOST || 'localhost';
        const port = process.env.MONGO_PORT || '27017';
        const user = process.env.MONGO_USER;
        const password = process.env.MONGO_PASSWORD;
        const db = process.env.MONGO_INITDB_DATABASE || 'test';
        const authSource = process.env.MONGO_AUTH_SOURCE || 'admin';

        const credentials = user && password ? `${user}:${password}@` : '';
        const params = credentials ? `?authSource=${authSource}` : '';
        const uri = `mongodb://${credentials}${host}:${port}/${db}${params}`;

        return { uri };
      },
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
