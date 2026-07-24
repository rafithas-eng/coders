import { StrongPasswordRule, UseCase, Validator } from "@poupig/shared";
import { User } from "../model";
import { CryptoProvider, UserRepository } from "../provider";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class RegisterUser implements UseCase<RegisterUserInput, void> {
  constructor(
    private readonly cryptoProvider: CryptoProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<void> {
    Validator.validate([
      {
        code: "user.password",
        value: input.password,
        rules: [new StrongPasswordRule()],
      },
    ]);

    const hashedPassword = await this.cryptoProvider.encrypt(input.password);

    const user = new User({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    user.validate();

    await this.userRepository.create(user);
  }
}
