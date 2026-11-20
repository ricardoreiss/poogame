import { character } from "./character";

interface statusEffect {
    name: string;
    count: number;
    stacks: number;

    onApply?(target: character): void;
    onTurnStart?(target: character): void;
    onTurnEnd?(target: character): void;
    onRemove?(target: character): void;
}

class Lascado implements statusEffect {
    public name = "Lascado"
    public count: number
    public stacks : number

    constructor(
        count: number,
        stacks: number
    ) {
        this.count = count
        this.stacks = stacks
    }

    public onApply(target: character): void {
        const dano = 5
        target.takeDamage(dano)
    }
}