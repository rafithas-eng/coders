import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { RegisterUser } from '@poupig/auth';
import type { RegisterUserInput } from '@poupig/auth';
import { DomainError, ValidationException } from '@poupig/shared';
import { BcryptCryptoProvider } from './bcrypt.crypto';
import { PrismaUserRepository } from './user.prisma';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly cryptoProvider: BcryptCryptoProvider,
    private readonly userRepository: PrismaUserRepository,
  ) {}

  @Post('/register')
  async registerUser(@Body() body: RegisterUserInput) {
    const useCase = new RegisterUser(this.cryptoProvider, this.userRepository);

    try {
      await useCase.execute(body);

      return {
        message: 'User registered successfully',
      };
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  private handleDomainError(error: unknown): never {
    if (error instanceof ValidationException) {
      throw new HttpException(
        {
          message: error.message,
          errors: error.errors.map((item) => item.message),
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (error instanceof DomainError) {
      throw new HttpException(
        {
          message: error.message,
        },
        error.statusCode,
      );
    }

    throw error;
  }
}
