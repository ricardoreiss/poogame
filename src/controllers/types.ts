import type { character } from './character'

export const attackResult = {
  HIT: 1,
  DODGED: 2,
  DEAD_TARGET: 3,
} as const;

export const TargetType = {
  POSITIONS: "POSITIONS",
  FIRST: "FIRST",
  LAST: "LAST",
} as const;

export interface action {
  name: string;
  user: character;
  target: character;
  coins: number;
  chance: number;
  activate: number;
  Execute(): void;
  Special(): void;
}