// src/chat/chat.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /chat/sessions
   * Creates a new chat session for user, optionally bound to a projectId.
   */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(@Request() req: any, @Body() dto: CreateSessionDto) {
    return this.chatService.createSession(req.user.id, dto);
  }

  /**
   * GET /chat/sessions
   * List all chat sessions for the authenticated user.
   */
  @Get('sessions')
  findSessions(@Request() req: any) {
    return this.chatService.findSessions(req.user.id);
  }

  /**
   * GET /chat/sessions/:sessionId
   * Returns a specific chat session with its full message history.
   */
  @Get('sessions/:sessionId')
  getSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req: any,
  ) {
    return this.chatService.getSession(sessionId, req.user.id);
  }

  /**
   * GET /chat/sessions/:sessionId/messages
   * Lists all messages in the session in chronological order.
   */
  @Get('sessions/:sessionId/messages')
  getMessages(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req: any,
  ) {
    return this.chatService.getMessages(sessionId, req.user.id);
  }

  /**
   * POST /chat/sessions/:sessionId/messages
   * Sends a message, triggers lightweight RAG context injection, and returns the AI reply.
   */
  @Post('sessions/:sessionId/messages')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(sessionId, req.user.id, dto);
  }
}
