import type { character } from './character'

export abstract class Passive {
  public name: string;
  public user!: character;

  constructor(name: string) {
    this.name = name;
  }

  onTurnStart(): void {}

  beforeHit(target: character, baseDamage: number): number {
    return baseDamage;
  }

  afterHit(target: character, damageInflicted: number): void {}

  onTakeDamage(damage: number, attacker?: character): number {
    return damage;
  }

  afterTakeDamage(damageTaken: number, attacker?: character): void {}
}

export abstract class Effect extends Passive {
  protected potency: number;
  protected count: number;
  protected stackPotency: boolean;
  protected stackCount: boolean;

  constructor(
    name: string,
    potency: number = 1,
    count: number = 1,
    stackPotency: boolean = true,
    stackCount: boolean = true
  ) {
    super(name);
    this.potency = potency;
    this.count = count;
    this.stackPotency = stackPotency;
    this.stackCount = stackCount;
  }

  public getPotency(): number {
    return this.potency;
  }

  public getCount(): number {
    return this.count;
  }

  public modPotency(amount: number): void {
    this.potency += amount;
    if (this.potency <= 0) {
      this.onRemove();
      this.user.removeEffect(this.name);
    }
  }

  public modCount(amount: number): void {
    this.count += amount;
    if (this.count <= 0) {
      this.onRemove();
      this.user.removeEffect(this.name);
    }
  }

  public stack(newEffect: Effect): void {
    if (this.stackPotency) {
      this.modPotency(newEffect.getPotency());
    }
    if (this.stackCount) {
      this.modCount(newEffect.getCount());
    }
  }

  onApply(): void {}
  onRemove(): void {}
}