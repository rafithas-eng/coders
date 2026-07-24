import { ValidationException } from "@poupig/shared";
import { User } from "../../../src";

const VALID_BCRYPT_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("User", () => {
  test("deve criar um usuario valido herdando os timestamps da entidade base", () => {
    const entity = new User({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Joao Silva",
      email: "joao@silva.com",
      password: VALID_BCRYPT_HASH,
    });

    expect(entity.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(entity.name).toBe("Joao Silva");
    expect(entity.email).toBe("joao@silva.com");
    expect(entity.password).toBe(VALID_BCRYPT_HASH);
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
    expect(entity.updatedAt.getTime()).toBe(entity.createdAt.getTime());
    expect(entity.deletedAt).toBeNull();
  });

  test("deve atualizar o updatedAt quando a entidade for clonada", () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const updatedAt = new Date("2024-01-02T00:00:00.000Z");
    const entity = new User({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Joao Silva",
      email: "joao@silva.com",
      password: VALID_BCRYPT_HASH,
      createdAt,
      updatedAt,
    });

    const clonedEntity = entity.clone({
      name: "Maria Silva",
      email: "maria@silva.com",
    });

    expect(clonedEntity).toBeInstanceOf(User);
    expect(clonedEntity).not.toBe(entity);
    expect(clonedEntity.id).toBe(entity.id);
    expect(clonedEntity.name).toBe("Maria Silva");
    expect(clonedEntity.email).toBe("maria@silva.com");
    expect(clonedEntity.password).toBe(VALID_BCRYPT_HASH);
    expect(clonedEntity.createdAt.getTime()).toBe(createdAt.getTime());
    expect(clonedEntity.updatedAt.getTime()).toBeGreaterThan(updatedAt.getTime());
    expect(clonedEntity.deletedAt).toBeNull();
  });

  test("deve permitir criar usuario invalido e so falhar ao validar explicitamente", () => {
    const user = new User({
      name: "Jo@o",
      email: "email-invalido",
      password: "12345678",
    });

    expect(user.name).toBe("Jo@o");
    expect(user.email).toBe("email-invalido");
    expect(user.password).toBe("12345678");
    expect(() => user.validate()).toThrow(ValidationException);
    expect(getValidationMessages(() => user.validate())).toEqual([
      "user.name.person.name",
      "user.email.invalid.email",
      "user.password.bcrypt.hash",
    ]);
  });

  test("deve validar o tamanho minimo e maximo do nome", () => {
    const shortNameUser = new User({
      name: "Jo",
      email: "joao@silva.com",
      password: VALID_BCRYPT_HASH,
    });
    const longNameUser = new User({
      name: `${"a".repeat(40)} ${"b".repeat(40)}`,
      email: "joao@silva.com",
      password: VALID_BCRYPT_HASH,
    });

    expect(() => shortNameUser.validate()).toThrow(ValidationException);
    expect(getValidationMessages(() => shortNameUser.validate())).toEqual([
      "user.name.min.length",
      "user.name.person.name",
    ]);
    expect(getValidationMessages(() => longNameUser.validate())).toEqual([
      "user.name.max.length",
    ]);
  });

  test("deve exigir nome e sobrenome validos", () => {
    const singleNameUser = new User({
      name: "Joao",
      email: "joao@silva.com",
      password: VALID_BCRYPT_HASH,
    });
    const spacedNameUser = new User({
      name: "   Joao   ",
      email: "joao@silva.com",
      password: VALID_BCRYPT_HASH,
    });

    expect(() => singleNameUser.validate()).toThrow(ValidationException);
    expect(getValidationMessages(() => singleNameUser.validate())).toEqual([
      "user.name.person.name",
    ]);
    expect(getValidationMessages(() => spacedNameUser.validate())).toEqual([
      "user.name.person.name",
    ]);
  });

  test("deve exigir uma senha bcrypt valida quando houver valor informado", () => {
    const user = new User({
      name: "Joao Silva",
      email: "joao@silva.com",
      password: "hash-invalido",
    });

    expect(() => user.validate()).toThrow(ValidationException);
    expect(getValidationMessages(() => user.validate())).toEqual([
      "user.password.bcrypt.hash",
    ]);
  });
});
