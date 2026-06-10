"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
test('hello returns string', () => {
    expect((0, index_1.hello)()).toBe('hello world');
});
