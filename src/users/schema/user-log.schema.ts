import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// user-log.schema.ts
@Schema({ timestamps: true })
export class UserLog extends Document {
  @Prop({ required: true, index: true }) // Índice para búsqueda rápida
  clerkId: string;

  @Prop({ required: true, index: true })
  eventType: string; // user.created, user.updated

  @Prop({ required: true })
  externalAuthId: string; // El instance_id de Clerk

  @Prop({ type: Object, required: true })
  rawJson: any; // El "cuerpo del delito" (toda la data de Clerk)

  @Prop({ default: 1, index: true })
  statusProcess: number; // 1: Pending, 2: Completed, 3: Error

  @Prop()
  errorMessage?: string;

  @Prop({ default: 0 })
  retryCount: number; // Para saber cuántas veces intentamos procesarlo
}

export const UserLogSchema = SchemaFactory.createForClass(UserLog);
