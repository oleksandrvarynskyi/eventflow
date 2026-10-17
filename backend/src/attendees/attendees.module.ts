import { Module } from '@nestjs/common';
import { AttendeesController } from './attendees.controller.js';

@Module({
  controllers: [AttendeesController],
})
export class AttendeesModule {}
