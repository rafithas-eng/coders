import { hello } from '../src/index'

test('hello returns string', () => {
  expect(hello()).toBe('hello world')
})
