import { character } from "./character";

class game {
    private rounds = 0
    private team1: character[] = []
    private team2: character[] = []
    
    private turnOrder: character[] = []

    public addCharacterTeam1(character: character): void {
        this.team1.push(character)
    }

    public removeCharacterTeam1(characterR: character): void {
        this.team1 = this.team1.filter(character => character !== characterR)
    }
    
    public addCharacterTeam2(character: character): void {
        this.team2.push(character)
    }
    
    public removeCharacterTeam2(characterR: character): void {
        this.team2 = this.team2.filter(character => character !== characterR)
    }

    private organizeOrder(): void {
        this.turnOrder = [...this.team1, ...this.team2]
        this.turnOrder.sort((a, b) => b.getSpeed() - a.getSpeed())
    }
    
    private newRound(): void {
        this.rounds++
        for (const character of this.team1) {
            character.newTurn()
        }
        for (const character of this.team2) {
            character.newTurn()
        }
    }
}