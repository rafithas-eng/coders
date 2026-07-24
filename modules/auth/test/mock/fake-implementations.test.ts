import { User } from "../../src";
import { FakeCryptoProvider, FakeUserRepository } from "./index";

describe("Auth test mocks", () => {
  test("fake crypto provider deve gerar hash valido e comparar corretamente", async () => {
    const cryptoProvider = new FakeCryptoProvider();

    const hash = await cryptoProvider.encrypt("Strong@123");

    expect(hash).toMatch(/^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    await expect(cryptoProvider.compare("Strong@123", hash)).resolves.toBe(true);
    await expect(cryptoProvider.compare("Wrong@123", hash)).resolves.toBe(false);
  });

  test("fake user repository deve persistir, consultar, paginar, atualizar e remover usuarios", async () => {
    const firstUser = new User({
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Joao Silva",
      email: "joao@silva.com",
      password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    });
    const secondUser = new User({
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Maria Silva",
      email: "maria@silva.com",
      password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    });
    const repository = new FakeUserRepository();

    await repository.create(firstUser);
    await repository.create(secondUser);

    await expect(repository.findById(firstUser.id)).resolves.toBe(firstUser);
    await expect(
      repository.findPage({
        page: 1,
        perPage: 1,
      }),
    ).resolves.toEqual({
      items: [firstUser],
      page: 1,
      perPage: 1,
      total: 2,
    });

    const updatedUser = firstUser.clone({
      name: "Joao Pedro Silva",
    });

    await expect(repository.update(updatedUser)).resolves.toBe(updatedUser);
    await expect(repository.findById(firstUser.id)).resolves.toBe(updatedUser);

    await expect(repository.delete(secondUser.id)).resolves.toBeUndefined();
    await expect(repository.findById(secondUser.id)).resolves.toBeNull();
    expect(repository.users).toEqual([updatedUser]);
  });

  test("fake user repository deve aceitar seed inicial, normalizar paginação e falhar ao atualizar usuario inexistente", async () => {
    const seededUser = new User({
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Ana Maria",
      email: "ana@maria.com",
      password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    });
    const missingUser = new User({
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "Carlos Souza",
      email: "carlos@souza.com",
      password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    });
    const repository = new FakeUserRepository([seededUser]);

    expect(repository.createdUsers).toEqual([seededUser]);

    await expect(
      repository.findPage({
        page: 0,
        perPage: 0,
      }),
    ).resolves.toEqual({
      items: [seededUser],
      page: 1,
      perPage: 1,
      total: 1,
    });

    await expect(repository.update(missingUser)).rejects.toThrow(
      `User with id "${missingUser.id}" was not found.`,
    );
  });
});
