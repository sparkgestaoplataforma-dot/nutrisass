/// <reference types="vite/client" />

declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function expect(actual: any): any;
}

export {};
