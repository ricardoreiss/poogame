import type { action } from "./types";
import { Passive, Effect } from "./passives"

export class character {
  public name: string;
  public id: number;
  public position: number;

  private hpCurrent: number;
  private hpMax: number;

  private baseAttackPwr: number;
  private baseDefensePwr: number;

  private attackPwr: number;
  private defensePwr: number;

  private bonusAttackSum: number = 0;
  private bonusAttackMult: number = 0;

  private bonusDefenseSum: number = 0;
  private bonusDefenseMult: number = 0;

  private speed: number;
  private actions: action[];
  private passives: Passive[];

  constructor(
    name: string,
    id: number,
    position: number,
    hpMax: number,
    attackPwr: number,
    defensePwr: number,
    speed: number,
    actions: action[] = [],
    passives: Passive[] = []
  ) {
    this.name = name;
    this.id = id;
    this.position = position;
    this.hpMax = hpMax;
    this.hpCurrent = hpMax;

    this.baseAttackPwr = attackPwr;
    this.baseDefensePwr = defensePwr;
    this.attackPwr = attackPwr;
    this.defensePwr = defensePwr;

    this.speed = speed;
    this.actions = actions;
    this.passives = [];

    for (const passive of passives) {
      this.addPassive(passive);
    }
  }

  // ------------------------------------------------------
  // 1. CÁLCULO DE ATTACKPWR E DEFENSEPWR
  // ------------------------------------------------------

  private recalculateAttributes(): void {
    const multAtk = Math.max(0, 1 + this.bonusAttackMult);
    this.attackPwr = Math.max(
      0,
      Math.floor((this.baseAttackPwr + this.bonusAttackSum) * multAtk)
    );

    const multDef = Math.max(0, 1 + this.bonusDefenseMult);
    this.defensePwr = Math.max(
      0,
      Math.floor((this.baseDefensePwr + this.bonusDefenseSum) * multDef)
    );
  }

  public addAttackSum(value: number): void {
    this.bonusAttackSum += value;
    this.recalculateAttributes();
  }

  public addAttackMult(multiplier: number): void {
    this.bonusAttackMult += multiplier - 1;
    this.recalculateAttributes();
  }

  public removeAttackMult(multiplier: number): void {
    this.bonusAttackMult -= multiplier - 1;
    this.recalculateAttributes();
  }

  public addDefenseSum(value: number): void {
    this.bonusDefenseSum += value;
    this.recalculateAttributes();
  }

  public addDefenseMult(multiplier: number): void {
    this.bonusDefenseMult += multiplier - 1;
    this.recalculateAttributes();
  }

  public removeDefenseMult(multiplier: number): void {
    this.bonusDefenseMult -= multiplier - 1;
    this.recalculateAttributes();
  }

  // ------------------
  // 2. BUSCA DE VALORES
  // ------------------

  public getBaseAttackPwr(): number {
    return this.baseAttackPwr;
  }

  public getAttackPwr(): number {
    return this.attackPwr;
  }

  public getBaseDefensePwr(): number {
    return this.baseDefensePwr;
  }

  public getDefensePwr(): number {
    return this.defensePwr;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getHpCurrent(): number {
    return this.hpCurrent;
  }

  public getHpMax(): number {
    return this.hpMax;
  }

  public isAlive(): boolean {
    return this.hpCurrent > 0;
  }

  public getPosition(): number {
    return this.position;    
  }
  
  // ------------------------------------
  // 3. PASSIVAS, VIDA, ESQUIVA E DANO
  // ------------------------------------

  public addPassive(passive: Passive): void {
    passive.user = this;
    this.passives.push(passive);
  }

  public startTurn(): void {
    if (!this.isAlive()) return;
    // Copia o array para evitar bugs caso um efeito se remova durante o turno
    for (const passive of [...this.passives]) {
      passive.onTurnStart();
    }
  }

  public applyEffect(newEffect: Effect): void {
    const existing = this.passives.find(
      (p) => p instanceof Effect && p.name === newEffect.name
    ) as Effect | undefined;

    if (existing) {
      existing.stack(newEffect);
    } else {
      this.addPassive(newEffect);
      newEffect.onApply();
    }
  }

  public removeEffect(name: string): void {
    this.passives = this.passives.filter(
      (p) => !(p instanceof Effect && p.name === name)
    );
  }

  public tryDodge(): boolean {
    return false;
  }

  public executeBeforeHit(target: character, baseDamage: number): number {
    let modifiedDamage = baseDamage;
    for (const passive of this.passives) {
      modifiedDamage = passive.beforeHit(target, modifiedDamage);
    }
    return modifiedDamage;
  }

  public executeAfterHit(target: character, damageInflicted: number): void {
    if (!target.isAlive()) return;

    for (const passive of this.passives) {
      passive.afterHit(target, damageInflicted);
    }
  }

  public heal(value: number): void {
    if (!this.isAlive() || value <= 0) return;
    this.hpCurrent = Math.min(this.hpMax, this.hpCurrent + value);
  }

  public receiveDamage(damage: number, attacker?: character): void {
    if (!this.isAlive()) return;

    let finalDamage = damage;
    for (const passive of this.passives) {
      finalDamage = passive.onTakeDamage(finalDamage, attacker);
    }

    finalDamage = Math.max(0, finalDamage);
    this.hpCurrent = Math.max(0, this.hpCurrent - finalDamage);
    console.log(
      `${this.name} recebeu ${finalDamage} de dano! (HP: ${this.hpCurrent}/${this.hpMax})`
    );

    if (this.isAlive()) {
      for (const passive of this.passives) {
        passive.afterTakeDamage(finalDamage, attacker);
      }
    }
  }

  // --------------------------------------
  // 4. AÇÕES (1, 2, 3)
  // --------------------------------------

  private executeByIndex(
    targetIndices: number[],
    team: character[],
    actionIndex: number
  ): void {
    const action = this.actions[actionIndex];

    if (action) {
      action.user = this;

      for (const idx of targetIndices) {
        const target = team[idx];

        if (target) {
          action.target = target;
          const coins = this.coinRoll(action.coins, action.chance);

          if (coins >= action.activate) {
            action.Special();
          } else {
            action.Execute();
          }
        } else {
          console.log(`Nenhum alvo encontrado na posição ${idx}.`);
        }
      }
    } else {
      console.log("Nenhuma habilidade configurada neste slot.");
    }
  }

  private roll(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private verifyChance(chance: number): boolean {
    const roll = this.roll(1, 100);
    return roll <= chance;
  }

  private coinRoll(coins: number, chance: number): number {
    let count = 0;
    for (let i = 0; i < coins; i++) {
      if (this.verifyChance(chance)) {
        count++;
      }
    }
    return count;
  }

  public action1(targetIndices: number[], team: character[]): void {
    this.executeByIndex(targetIndices, team, 0);
  }

  public action2(targetIndices: number[], team: character[]): void {
    this.executeByIndex(targetIndices, team, 1);
  }

  public action3(targetIndices: number[], team: character[]): void {
    this.executeByIndex(targetIndices, team, 2);
  }
}
