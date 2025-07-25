import { GameEngine } from "@/game/GameEngine";
import { MainMenuScene } from "@/game/MainMenuScene";
import { LevelSelectScene } from "@/game/LevelSelectScene";

import { RailyardLevel1Scene } from "@/game/levels/RailyardLevel1Scene";
import { RailyardLevel2Scene } from "./game/levels/RailyardLevel2Scene";
// import { RailyardLevel2Scene } from '@/game/levels/RailyardLevel2Scene';
// import { RailyardLevel3Scene } from '@/game/levels/RailyardLevel3Scene';
import { LevelManager } from "@/game/LevelManager";
import { GameStateType, Level, Scene } from "@/types";

class Game {
  private engine: GameEngine;
  private levelManager: LevelManager;
  private canvas: HTMLCanvasElement;
  private mainMenuScene: MainMenuScene;
  private levelSelectScene: LevelSelectScene;

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error("Could not find game canvas element");
    }

    this.engine = new GameEngine(this.canvas);
    this.levelManager = new LevelManager();
    this.mainMenuScene = new MainMenuScene(
      this.engine.getGameStateManager(),
      this.canvas
    );
    this.levelSelectScene = new LevelSelectScene(
      this.engine.getGameStateManager(),
      this.levelManager,
      this.canvas
    );

    this.setupLevels();
    this.setupSceneTransitions();
    this.setupUI();
    this.init();
  }

  private setupLevels(): void {
    // Register Level 1 - New Railyard System
    const level1: Level = {
      id: 1,
      name: "First Delivery",
      description: "Drag the train car to the exit",
      targetScore: 500,
      createScene: () =>
        new RailyardLevel1Scene(this.engine.getGameStateManager(), this.canvas),
    };

    const level2: Level = {
      id: 2,
      name: "S-Curve Challenge",
      description:
        "Navigate the curved track with draggable and non-draggable entities",
      targetScore: 1000,
      createScene: () =>
        new RailyardLevel2Scene(this.engine.getGameStateManager(), this.canvas),
    };

    // const level3: Level = {
    //   id: 3,
    //   name: 'Triple Track Challenge',
    //   description: 'Sort three trains: red, blue, and green cars to their matching exits',
    //   targetScore: 1500,
    //   createScene: () => new RailyardLevel3Scene(this.engine.getGameStateManager(), this.canvas)
    // };

    this.levelManager.registerLevel(level1);
    this.levelManager.registerLevel(level2);
    // this.levelManager.registerLevel(level3);

    // Future levels can be added here easily:
    // this.levelManager.registerLevel(level3);
    // this.levelManager.registerLevel(level4);

    console.log(`Registered ${this.levelManager.getLevelCount()} levels`);
  }

  private setupSceneTransitions(): void {
    this.engine.setSceneTransitionCallback((newState: GameStateType) => {
      return this.createSceneForState(newState);
    });
  }

  private createSceneForState(state: GameStateType): Scene | null {
    const gameStateManager = this.engine.getGameStateManager();

    switch (state) {
      case GameStateType.MAIN_MENU:
        return this.mainMenuScene;

      case GameStateType.LEVEL_SELECT:
        return this.levelSelectScene;

      case GameStateType.PLAYING:
        // Set the current level in level manager
        const currentLevel = gameStateManager.getCurrentLevel();
        this.levelManager.setCurrentLevel(currentLevel);
        return this.levelManager.createCurrentLevelScene() || null;

      case GameStateType.PAUSED:
        // Keep the current scene but the engine will handle pause overlay
        return null;

      case GameStateType.LEVEL_COMPLETE:
        // For now, return to main menu. Later we can add a level complete scene
        setTimeout(() => {
          if (this.levelManager.hasNextLevel()) {
            this.levelManager.advanceToNextLevel();
            gameStateManager.setState(GameStateType.PLAYING);
          } else {
            // Game completed!
            alert("Congratulations! You completed all levels!");
            gameStateManager.setState(GameStateType.MAIN_MENU);
          }
        }, 1000);
        return null;

      case GameStateType.GAME_OVER:
        // For now, return to main menu. Later we can add a game over scene
        setTimeout(() => {
          gameStateManager.setState(GameStateType.MAIN_MENU);
        }, 2000);
        return null;

      default:
        console.warn(`No scene defined for state: ${state}`);
        return this.mainMenuScene;
    }
  }

  private setupUI(): void {
    // UI setup can be expanded here for future features
    // For now, all interaction is handled through the game canvas
    console.log("UI setup complete - game controls are handled in-game");
  }

  private init(): void {
    // Set initial scene to main menu
    this.engine.setScene(this.mainMenuScene);
    this.startNewGame();
  }

  private startNewGame(): void {
    this.engine.reset();
    this.levelManager.resetToFirstLevel();
    this.engine.start();
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    new Game();
    console.log("RailYard Shuffle game initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize game:", error);
  }
});
