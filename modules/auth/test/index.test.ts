import { somar } from "../src/index";

test("deve somar dois números", () => {
    const result = somar(5, 10);
    expect(result).toBe(15);
});

