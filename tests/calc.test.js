const { add, subtract, multiply, divide } = require('../src/calc');

describe('Calculator module', () => {
  test('adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
  });

  test('subtracts two numbers correctly', () => {
    expect(subtract(5, 3)).toBe(2);
    expect(subtract(0, 10)).toBe(-10);
  });

  test('multiplies two numbers correctly', () => {
    expect(multiply(4, 5)).toBe(20);
    expect(multiply(-2, 3)).toBe(-6);
  });

  test('divides two numbers correctly', () => {
    expect(divide(10, 2)).toBe(5);
    expect(divide(-9, 3)).toBe(-3);
  });

  test('throws when dividing by zero', () => {
    expect(() => divide(5, 0)).toThrow('Cannot divide by zero');
  });
});
