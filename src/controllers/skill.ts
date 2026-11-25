import type { character } from './character'
import { action, attackResult, TargetType } from "./types"

export abstract class Skill implements action {
  public name: string;
  public user!: character;
  public target!: character;
  public coins: number;
  public chance: number;
  public activate: number;

  protected usePositions: number[];
  protected targetPositions: number[];
  protected targetType: string;

  constructor(
    name: string,
    coins: number = 0,
    chance: number = 50,
    activate: number = 1,
    usePositions: number[] = [1, 2, 3, 4],
    targetPositions: number[] = [1, 2, 3, 4],
    targetType: string = TargetType.POSITIONS // Corrigido: usando TargetType com T maiúsculo
  ) {
    this.name = name;
    this.coins = coins;
    this.chance = chance;
    this.activate = activate;
    this.usePositions = usePositions;
    this.targetPositions = targetPositions;
    this.targetType = targetType;
  }

  abstract Execute(): void;

  Special(): void {
    this.Execute();
  }

  protected canUse(enemies: character[] = []): boolean {
    if (!this.user || !this.target) return false;
    if (!this.user.isAlive() || !this.target.isAlive()) return false;
    if (!this.usePositions.includes(this.user.position)) return false;

    if (this.targetType === TargetType.FIRST && enemies.length > 0) {
      return this.target === enemies[0];
    }

    if (this.targetType === TargetType.LAST && enemies.length > 0) {
      return this.target === enemies[enemies.length - 1];
    }

    return this.targetPositions.includes(this.target.position);
  }

  protected tryAttack(
    target: character,
    baseDamage: number,
    bonusAttackPwr: number = 0
  ): number {
    if (!target || !target.isAlive()) {
      return attackResult.DEAD_TARGET;
    }

    if (target.tryDodge()) {
      console.log(`${target.name} DODGED!`);
      return attackResult.DODGED;
    }

    baseDamage = this.user.executeBeforeHit(target, baseDamage);

    const totalAtck = this.user.getAttackPwr() + bonusAttackPwr;
    const totalDef = target.getDefensePwr();
    const difference = totalAtck - totalDef;
    const pwrFactor = 1 + difference / (Math.abs(difference) + 25);

    const finalDamage = Math.max(0, Math.floor(baseDamage * pwrFactor));
    target.receiveDamage(finalDamage, this.user);

    this.user.executeAfterHit(target, finalDamage);

    return attackResult.HIT;
  }
}