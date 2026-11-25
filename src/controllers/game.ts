import { character } from "./character"

 export class game {
    private rounds = 0
    private team1: (character | null)[] = [null, null, null, null]
    private team2: (character | null)[] = [null, null, null, null]
    private currentTurn: number = 0
    
    private turnOrder: character[] = []

    public addCharacterTeam1(character: character): void {
        const avaliable = this.team1.indexOf(null)
        if (avaliable !== -1) {
            this.team1[avaliable] = character
            character.position = avaliable + 1
        }
        else {
            console.log("Time cheio")
        }
    }

    public removeCharacterTeam1(characterR: character): void {
        const removeChar = this.team1.indexOf(characterR)
        if (removeChar !== -1) {
            this.team1[removeChar] = null
        } 
        else {
            console.log("Personagem não encontrado")
        }
    }
    
    public addCharacterTeam2(character: character): void {
        const avaliable = this.team2.indexOf(null)
        if (avaliable !== -1) {
            this.team2[avaliable] = character
            character.position = avaliable + 1
        }
        else {
            console.log("Time cheio")
        }
    }
    
    public removeCharacterTeam2(characterR: character): void {
        const removeChar = this.team2.indexOf(characterR)
        if (removeChar !== -1) {
            this.team2[removeChar] = null
        }
        else {
            console.log("Personagem não encontrado")
        }
    }

    public removeDeadChar(): void {
        this.team1 = this.team1.filter(char => char !== null && char.isAlive())
        this.team2 = this.team2.filter(char => char !== null && char.isAlive())
        this.updatePositions(this.team1)
        this.updatePositions(this.team2)
    }

    private updatePositions(team: (character | null)[]): void {
        team.forEach((char, index) => { if (char !== null) {
        char.position = index + 1;
    }});
    }

    private organizeOrder(): void {
        this.turnOrder = [...this.team1, ...this.team2].filter((c) => c !== null && c.isAlive())
        this.turnOrder.sort((a, b) => b.getSpeed() - a.getSpeed())
    }
    public ChangeOrder(char: character, team: (character | null)[], direction: number) void {
        const position = char.getPosition();
        if(direction === 0) {
            if(position != 0) {      // Se ele estiver na borda, n é para ele trocar 
               const position2 = position - 1;
               const character = team[position2];
               team[position2] = char;
               team[position] = character;
            } else {
               console.log("não há personagem atrás");
            } 
        }
        elseif (direction === 0) {
            if(position != 3) {      // Se ele estiver na borda, n é para ele trocar 
               const position2 = position + 1;
               const character = team[position2];
               team[position2] = char;
               team[position] = character;
            } else {
               console.log("não há personagem na frente");
            } 
        } 
        else {
            console.log("Inválido");
        }
    }
    
    public newRound(): void {
        this.rounds++
        this.currentTurn = 0
        this.removeDeadChar()
        this.organizeOrder()
        for (const character of this.turnOrder) {
            character.startTurn()
        }
    }

    public getCurrentCharacter(): character | undefined {
        return this.turnOrder[this.currentTurn]
    }

    public nextTurn(): character | undefined {
        this.removeDeadChar()
        this.currentTurn++

        while (this.currentTurn < this.turnOrder.length && !this.turnOrder[this.currentTurn].isAlive()) {
            this.currentTurn++
        }

        if (this.currentTurn >= this.turnOrder.length) {
            this.newRound()
        }

        return this.getCurrentCharacter()
    }

    public getTeam1(): character[] {
        return this.team1.filter(c => c !== null)
    }

    public getTeam2(): character[] {
        return this.team2.filter(c => c !== null)
    }

    public isGameOver(): boolean {
        const team1Alive = this.team1.some((c) => c !== null && c.isAlive());
        const team2Alive = this.team2.some((c) => c !== null && c.isAlive());
        return !team1Alive || !team2Alive;
    }

    public getEnemies(char: character): character[] {
        if (this.team1.includes(char)) {
            return this.getTeam2()
        }
        else {
            return this.getTeam1()
        }
    }

    public getAllies(char: character): character[] {
        if (this.team1.includes(char)) {
            return this.getTeam1()
        }
        else {
            return this.getTeam2()
        }
    }
}
