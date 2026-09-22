import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { MongooseError } from 'mongoose';

type ErrorResponse = {
  message?: string | string[];
};

type MongoDuplicateError = {
  code?: number;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Something went wrong. Please try again.';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const errorResponse = exceptionResponse as ErrorResponse;

        message = errorResponse.message ?? exception.message;
      } else {
        message = exception.message;
      }
    } else if (
      exception instanceof MongooseError &&
      exception.name === 'ValidationError'
    ) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as MongoDuplicateError).code === 11000
    ) {
      statusCode = HttpStatus.CONFLICT;
      message = 'This value already exists.';
    }

    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(statusCode).json({
      success: false,
      message,
      statusCode,
    });
  }
}
