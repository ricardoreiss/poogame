import { statusEffect } from "./statusEffects";

function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function verifyChance(chance: number): boolean {
  const rolled = roll(1, 100);
  return rolled <= chance;
}

interface abilities {
  name: string;
  type: string;
  user: character;
  target: number[]; 
  Execute(atckPwr: number, target: character): void;
}

interface PassiveSkill {
  name: string;
  description?: string;
}

class character {
  public name: string;
  public id: number;
  private hpCurrent: number;
  private hpMax: number;
  private attackPwr: number;
  private defensePwr: number;
  private speed: number;
  private luck: number;
  private actions: abilities[];

  private passives: PassiveSkill[];
  private statuses: Map<string, StatusEffect>;
  private skillDeck: abilities[];

  constructor(
    name: string,
    id: number,
    hpMax: number,
    attackPwr: number,
    defensePwr: number,
    speed: number,
    luck: number,
    actions: abilities[] = []
  ) {
    this.hpMax = hpMax;
    this.hpCurrent = hpMax;
    this.attackPwr = attackPwr;
    this.defensePwr = defensePwr;
    this.speed = speed;
    this.luck = luck;
    this.actions = actions;

    this.passives = [];
    this.statuses = new Map<string, statusEffect>();
    this.skillDeck = [];
  }

  getAtckPwr(): number {
    return this.attackPwr
  }
  
  getDefPwr(): number {
    return this.defensePwr
  }
  
  getSpeed(): number {
    return this.speed
  }

  getLuck(): number {
    return this.luck
  }

  public takeDamage(damage: number): void {
    const totalDamage = damage
    this.hpCurrent -= totalDamage
    this.hpCurrent = Math.max(this.hpCurrent, 0)
  }

  public healHP(heal: number): void {
    this.hpCurrent += heal
    this.hpCurrent = Math.min(this.hpCurrent, this.hpMax)
  }

  public modifyAtckPwr(amount: number): void {
    this.attackPwr += amount
  }

  public modifyDefPwr(amount: number): void {
    this.defensePwr += amount
  }

  public modifySpeed(amount: number): void {
    this.speed += amount
  }
  public modifyLuck(amount: number): void {
    this.luck += amount
  }

  public addStatus(newEffect: statusEffect): void {
    const e  = this.statuses.get(newEffect.name)

    if (e) {
      e.count = Math.max(e.count, newEffect.count)
      if (newEffect.stacks) {
        e.stacks = (e.stacks ?? 1) + newEffect.stacks
      }
    }
    else {
      this.statuses.set(newEffect.name, newEffect)
      newEffect.onApply?.(this)
    }
  }

  public newTurn(): void {
    for (const [key, effect] of this.statuses) {
      effect.onTurnStart?.(this);
      effect.duration--;

      if (effect.duration <= 0) {
        effect.onRemove?.(this);
        this.statuses.delete(key);
      }
    }
  }
  
  private executeByIndex(targetIndices: number[], enemyTeam: character[], actionIndex: number): void {
    const action = this.actions[actionIndex];

    if (action) {
      action.user = this;
      action.target = targetIndices;

      for (const idx of targetIndices) {
        const enemy = enemyTeam[idx];

        if (enemy) {
          action.Execute(this.attackPwr, enemy);
        } else {
          console.log(`Nenhum inimigo encontrado na posição ${idx}.`);
        }
      }
    } else {
      console.log("Nenhuma habilidade configurada neste slot.");
    }
  }

  public action1(targetIndices: number[], enemyTeam: character[]): void {
    this.executeByIndex(targetIndices, enemyTeam, 0);
  }

  public action2(targetIndices: number[], enemyTeam: character[]): void {
    this.executeByIndex(targetIndices, enemyTeam, 1);
  }

  public action3(targetIndices: number[], enemyTeam: character[]): void {
    this.executeByIndex(targetIndices, enemyTeam, 2);
  }
}