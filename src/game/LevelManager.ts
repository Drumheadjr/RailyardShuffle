import { Level, Scene } from '@/types';

export class LevelManager {
  private levels: Map<number, Level> = new Map();
  private currentLevelId: number = 1;

  constructor() {
    this.registerDefaultLevels();
  }

  private registerDefaultLevels(): void {
    // This will be populated with actual levels
    console.log('Level Manager initialized - levels will be registered by game');
  }

  public registerLevel(level: Level): void {
    this.levels.set(level.id, level);
    console.log(`Registered level ${level.id}: ${level.name}`);
  }

  public getLevel(levelId: number): Level | undefined {
    return this.levels.get(levelId);
  }

  public getCurrentLevel(): Level | undefined {
    return this.levels.get(this.currentLevelId);
  }

  public setCurrentLevel(levelId: number): boolean {
    if (this.levels.has(levelId)) {
      this.currentLevelId = levelId;
      console.log(`Current level set to ${levelId}`);
      return true;
    }
    console.warn(`Level ${levelId} not found`);
    return false;
  }

  public getNextLevel(): Level | undefined {
    const nextLevelId = this.currentLevelId + 1;
    return this.levels.get(nextLevelId);
  }

  public hasNextLevel(): boolean {
    return this.levels.has(this.currentLevelId + 1);
  }

  public advanceToNextLevel(): boolean {
    if (this.hasNextLevel()) {
      this.currentLevelId++;
      console.log(`Advanced to level ${this.currentLevelId}`);
      return true;
    }
    console.log('No more levels available');
    return false;
  }

  public resetToFirstLevel(): void {
    this.currentLevelId = 1;
    console.log('Reset to first level');
  }

  public getAllLevels(): Level[] {
    return Array.from(this.levels.values()).sort((a, b) => a.id - b.id);
  }

  public getLevelCount(): number {
    return this.levels.size;
  }

  public getCurrentLevelId(): number {
    return this.currentLevelId;
  }

  public createCurrentLevelScene(): Scene | undefined {
    const currentLevel = this.getCurrentLevel();
    if (currentLevel) {
      console.log(`Creating scene for level ${currentLevel.id}: ${currentLevel.name}`);
      return currentLevel.createScene();
    }
    console.warn('No current level available to create scene');
    return undefined;
  }

  public getLevelProgress(): { current: number; total: number; percentage: number } {
    const total = this.getLevelCount();
    const current = this.currentLevelId;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    
    return { current, total, percentage };
  }

  public isLastLevel(): boolean {
    return this.currentLevelId === this.getLevelCount();
  }

  public getLevelInfo(levelId?: number): string {
    const id = levelId || this.currentLevelId;
    const level = this.getLevel(id);
    
    if (!level) {
      return `Level ${id}: Not Found`;
    }

    let info = `Level ${level.id}: ${level.name}`;
    if (level.description) {
      info += ` - ${level.description}`;
    }
    if (level.targetScore) {
      info += ` (Target: ${level.targetScore} points)`;
    }
    if (level.timeLimit) {
      info += ` (Time: ${level.timeLimit}s)`;
    }
    
    return info;
  }
}
