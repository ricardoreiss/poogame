const ResultadoAtaque = {
    ACERTOU: 1,
    ESQUIVOU: 2,
    ALVO_MORTO: 3
} as const;

const TipoAlvo = {
    POSICOES: 'POSICOES',
    PRIMEIRO: 'PRIMEIRO',
    ULTIMO: 'ULTIMO'
} as const;

interface action {
    name: string;
    user: character;
    target: character;
    coins: number;
    chance: number;
    activate: number;
    Execute(): void;
    Special(): void;
}

abstract class Passive {
    public name: string;
    public user!: character;

    constructor(name: string) {
        this.name = name;
    }

    aoIniciarTurno(): void {}

    antesDoGolpe(alvo: character, danoBase: number): number {
        return danoBase;
    }

    depoisDoGolpe(alvo: character, danoCausado: number): void {}

    aoReceberDano(dano: number, atacante?: character): number { return dano; }
    aposReceberDano(danoSofrido: number, atacante?: character): void {}
}

abstract class Effect extends Passive {
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
            this.user.removerEfeito(this.name);
        }
    }

    public modCount(amount: number): void {
        this.count += amount;
        if (this.count <= 0) {
            this.onRemove();
            this.user.removerEfeito(this.name);
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

class character {
    public name: string;
    public id: number;
    public posicao: number;

    private hpCurrent: number;
    private hpMax: number;

    // Valores Base 
    private baseAttackPwr: number;
    private baseDefensePwr: number;

    // Valores Modificados
    private attackPwr: number;
    private defensePwr: number;

    // Modificadores
    private bonusAttackSoma: number = 0;
    private bonusAttackMult: number = 0; // Guarda o a mais (2,5x fica 1,5)

    private bonusDefenseSoma: number = 0;
    private bonusDefenseMult: number = 0; // Guarda o a mais (2x fica 1)

    private speed: number;
    private actions: action[];
    private passives: Passive[];

    constructor(
        name: string,
        id: number,
        posicao: number,
        hpMax: number,
        attackPwr: number,
        defensePwr: number,
        speed: number,
        actions: action[] = [],
        passives: Passive[] = []
    ) {
        this.name = name;
        this.id = id;
        this.posicao = posicao;
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
            this.adicionarPassiva(passive);
        }
    }

    // ------------------------------------------------------
    // 1. CÁLCULO de ATACKPWR E DEFENSEPWR
    // ------------------------------------------------------

    private recalcularAtributos(): void {
        const multAtk = Math.max(0, 1 + this.bonusAttackMult);
        this.attackPwr = Math.max(0, Math.floor((this.baseAttackPwr + this.bonusAttackSoma) * multAtk));

        const multDef = Math.max(0, 1 + this.bonusDefenseMult);
        this.defensePwr = Math.max(0, Math.floor((this.baseDefensePwr + this.bonusDefenseSoma) * multDef));
    }

    public adicionarAttackSoma(valor: number): void {
        this.bonusAttackSoma += valor;
        this.recalcularAtributos();
    }

    public adicionarAttackMultiplicador(multiplicador: number): void {
        this.bonusAttackMult += (multiplicador - 1);
        this.recalcularAtributos();
    }

    public removerAttackMultiplicador(multiplicador: number): void {
        this.bonusAttackMult -= (multiplicador - 1);
        this.recalcularAtributos();
    }

    public adicionarDefenseSoma(valor: number): void {
        this.bonusDefenseSoma += valor;
        this.recalcularAtributos();
    }

    public adicionarDefenseMultiplicador(multiplicador: number): void {
        this.bonusDefenseMult += (multiplicador - 1);
        this.recalcularAtributos();
    }

    public removerDefenseMultiplicador(multiplicador: number): void {
        this.bonusDefenseMult -= (multiplicador - 1);
        this.recalcularAtributos();
    }

    // ------------------
    // 2. GET DE VALORES
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

    public getHpAtual(): number {
        return this.hpCurrent;
    }

    public getHpMax(): number {
        return this.hpMax;
    }

    public estaVivo(): boolean {
        return this.hpCurrent > 0;
    }

    // ------------------------------------
    // 3. PASSIVAS, VIDA, ESQUIVA E DANO
    // ------------------------------------

    public adicionarPassiva(passive: Passive): void {
        passive.user = this;
        this.passives.push(passive);
    }

    public iniciarTurno(): void {
        if (!this.estaVivo()) return;
        for (const passive of this.passives) {
            passive.aoIniciarTurno();
        }
    }

    public aplicarEfeito(novoEfeito: Effect): void {
        const existente = this.passives.find(
            p => p instanceof Effect && p.name === novoEfeito.name
        ) as Effect | undefined;

        if (existente) {
            existente.stack(novoEfeito);
        } else {
            this.adicionarPassiva(novoEfeito);
            novoEfeito.onApply();
        }
    }

    public removerEfeito(nome: string): void {
        this.passives = this.passives.filter(p => !(p instanceof Effect && p.name === nome));
    }

    public tentarEsquivar(): boolean {
        return false;
    }

    public executarAntesDoGolpe(alvo: character, danoBase: number): number {
        let danoModificado = danoBase;
        for (const passive of this.passives) {
            danoModificado = passive.antesDoGolpe(alvo, danoModificado);
        }
        return danoModificado;
    }

    public executarDepoisDoGolpe(alvo: character, danoCausado: number): void {
        if (!alvo.estaVivo()) return;

        for (const passive of this.passives) {
            passive.depoisDoGolpe(alvo, danoCausado);
        }
    }

    public curar(valor: number): void {
        if (!this.estaVivo() || valor <= 0) return;
        this.hpCurrent = Math.min(this.hpMax, this.hpCurrent + valor);
    }

    public receberDano(dano: number, atacante?: character): void {
        if (!this.estaVivo()) return;

        let danoFinal = dano;
        for (const passive of this.passives) {
            danoFinal = passive.aoReceberDano(danoFinal, atacante);
        }

        danoFinal = Math.max(0, danoFinal);
        this.hpCurrent = Math.max(0, this.hpCurrent - danoFinal);
        console.log(`${this.name} recebeu ${danoFinal} de dano! (HP: ${this.hpCurrent}/${this.hpMax})`);

        if (this.estaVivo()) {
            for (const passive of this.passives) {
                passive.aposReceberDano(danoFinal, atacante);
            }
        }
    }

    // --------------------------------------
    // 4. AÇÕES (1,2,3)
    // --------------------------------------

    private executeByIndex(target: character, index: number): void {
        const action = this.actions[index];

        if (action) {
            action.user = this;
            action.target = target;
            const coins = this.coinRoll(action.coins, action.chance);
            if (coins >= action.activate) {
                action.Special();
            } else {
                action.Execute();
            }
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
                count = count + 1;
            }
        }
        return count;
    }

    public action1(target: character): void {
        this.executeByIndex(target, 0);
    }

    public action2(target: character): void {
        this.executeByIndex(target, 1);
    }

    public action3(target: character): void {
        this.executeByIndex(target, 2);
    }
}

abstract class Skill implements action {
    public name: string;
    public user!: character;   
    public target!: character; 
    public coins: number;
    public chance: number;
    public activate: number;

    protected posicoesUso: number[];
    protected posicoesAlvo: number[];
    protected tipoAlvo: string;

    constructor(
        name: string,
        coins: number = 0,
        chance: number = 50,
        activate: number = 1,
        posicoesUso: number[] = [1, 2, 3, 4],
        posicoesAlvo: number[] = [1, 2, 3, 4],
        tipoAlvo: string = TipoAlvo.POSICOES
    ) {
        this.name = name;
        this.coins = coins;
        this.chance = chance;
        this.activate = activate;
        this.posicoesUso = posicoesUso;
        this.posicoesAlvo = posicoesAlvo;
        this.tipoAlvo = tipoAlvo;
    }

    abstract Execute(): void;

    Special(): void {
        this.Execute();
    }

    protected podeUsar(inimigos: character[] = []): boolean {
        if (!this.user || !this.target) return false;
        if (!this.user.estaVivo() || !this.target.estaVivo()) return false;
        if (!this.posicoesUso.includes(this.user.posicao)) return false;

        if (this.tipoAlvo === TipoAlvo.PRIMEIRO && inimigos.length > 0) {
            return this.target === inimigos[0];
        }

        if (this.tipoAlvo === TipoAlvo.ULTIMO && inimigos.length > 0) {
            return this.target === inimigos[inimigos.length - 1];
        }

        return this.posicoesAlvo.includes(this.target.posicao);
    }

    protected tentarAtacar(alvo: character, danoBase: number, bonusAttackPwr: number = 0): number {
        if (!alvo || !alvo.estaVivo()) {
            return ResultadoAtaque.ALVO_MORTO;
        }

        if (alvo.tentarEsquivar()) {
            console.log(`${alvo.name} esquivou!`);
            return ResultadoAtaque.ESQUIVOU;
        }

        danoBase = this.user.executarAntesDoGolpe(alvo, danoBase);

        const atkTotal = this.user.getAttackPwr() + bonusAttackPwr;
        const defTotal = alvo.getDefensePwr();
        const diferenca = atkTotal - defTotal;
        const fatorPoder = 1 + (diferenca / (Math.abs(diferenca) + 25));

        const danoFinal = Math.max(0, Math.floor(danoBase * fatorPoder));
        alvo.receberDano(danoFinal, this.user);

        this.user.executarDepoisDoGolpe(alvo, danoFinal);

        return ResultadoAtaque.ACERTOU;
    }
}