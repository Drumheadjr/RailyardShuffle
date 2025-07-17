import { GameState, GameStateType, GameStateManager as IGameStateManager } from '@/types';

export class GameStateManager implements IGameStateManager {
  private gameState: GameState;
  private stateChangeCallbacks: Map<GameStateType, (() => void)[]> = new Map();

  constructor() {
    this.gameState = {
      isRunning: false,
      isPaused: false,
      score: 0,
      currentLevel: 1,
      currentState: GameStateType.MAIN_MENU,
      lives: 3
    };

    // Initialize callback arrays for each state
    Object.values(GameStateType).forEach(state => {
      this.stateChangeCallbacks.set(state, []);
    });
  }

  public getCurrentState(): GameStateType {
    return this.gameState.currentState;
  }

  public setState(newState: GameStateType): void {
    const previousState = this.gameState.currentState;
    
    if (previousState === newState) {
      return; // No change needed
    }

    console.log(`State transition: ${previousState} -> ${newState}`);
    
    this.gameState.currentState = newState;
    
    // Handle state-specific logic
    switch (newState) {
      case GameStateType.MAIN_MENU:
        this.gameState.isPaused = false;
        break;
      
      case GameStateType.PLAYING:
        this.gameState.isPaused = false;
        this.gameState.isRunning = true;
        break;
      
      case GameStateType.PAUSED:
        this.gameState.isPaused = true;
        break;
      
      case GameStateType.GAME_OVER:
        this.gameState.isRunning = false;
        this.gameState.isPaused = false;
        break;
      
      case GameStateType.LEVEL_COMPLETE:
        this.gameState.isPaused = false;
        break;
    }

    // Trigger callbacks for the new state
    const callbacks = this.stateChangeCallbacks.get(newState) || [];
    callbacks.forEach(callback => callback());
  }

  public getGameData(): GameState {
    return { ...this.gameState };
  }

  public updateScore(points: number): void {
    this.gameState.score += points;
    console.log(`Score updated: +${points} (Total: ${this.gameState.score})`);
  }

  public nextLevel(): void {
    this.gameState.currentLevel++;
    this.gameState.score += 100; // Bonus for completing level
    console.log(`Advanced to level ${this.gameState.currentLevel}`);
  }

  public resetGame(): void {
    const wasRunning = this.gameState.isRunning;
    this.gameState = {
      isRunning: wasRunning,
      isPaused: false,
      score: 0,
      currentLevel: 1,
      currentState: GameStateType.MAIN_MENU,
      lives: 3
    };
    console.log('Game reset');
  }

  public loseLife(): boolean {
    this.gameState.lives--;
    console.log(`Life lost! Lives remaining: ${this.gameState.lives}`);
    
    if (this.gameState.lives <= 0) {
      this.setState(GameStateType.GAME_OVER);
      return false; // Game over
    }
    return true; // Still has lives
  }

  public addLife(): void {
    this.gameState.lives++;
    console.log(`Extra life gained! Lives: ${this.gameState.lives}`);
  }

  // Event system for state changes
  public onStateChange(state: GameStateType, callback: () => void): void {
    const callbacks = this.stateChangeCallbacks.get(state) || [];
    callbacks.push(callback);
    this.stateChangeCallbacks.set(state, callbacks);
  }

  public removeStateChangeCallback(state: GameStateType, callback: () => void): void {
    const callbacks = this.stateChangeCallbacks.get(state) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // Utility methods
  public isPlaying(): boolean {
    return this.gameState.currentState === GameStateType.PLAYING;
  }

  public isPaused(): boolean {
    return this.gameState.isPaused;
  }

  public isGameOver(): boolean {
    return this.gameState.currentState === GameStateType.GAME_OVER;
  }

  public getCurrentLevel(): number {
    return this.gameState.currentLevel;
  }

  public setCurrentLevel(level: number): void {
    this.gameState.currentLevel = level;
    console.log(`Game state current level set to: ${level}`);
  }

  public getScore(): number {
    return this.gameState.score;
  }

  public getLives(): number {
    return this.gameState.lives;
  }
}
