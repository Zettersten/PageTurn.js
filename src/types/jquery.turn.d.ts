import type { TurnOptions } from '../types.js';

declare global {
  interface JQuery {
    turn(): JQuery;
    turn(options: Partial<TurnOptions>): JQuery;
    turn(method: string, ...args: unknown[]): unknown;
    flip(): JQuery;
    flip(options: Record<string, unknown>): JQuery;
    flip(method: string, ...args: unknown[]): unknown;
  }
}

export {};
