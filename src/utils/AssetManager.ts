export interface AssetConfig {
  name: string;
  basePath: string;
  extensions: string[];
}

export class AssetManager {
  private static instance: AssetManager;
  private images: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  private defaultExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  public async loadImage(config: AssetConfig): Promise<HTMLImageElement> {
    const { name, basePath, extensions = this.defaultExtensions } = config;

    // Return cached image if already loaded
    if (this.images.has(name)) {
      return this.images.get(name)!;
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    // Create new loading promise
    const loadingPromise = this.tryLoadWithExtensions(basePath, extensions, name);
    this.loadingPromises.set(name, loadingPromise);

    try {
      const image = await loadingPromise;
      this.images.set(name, image);
      this.loadingPromises.delete(name);
      console.log(`Successfully loaded image: ${name}`);
      return image;
    } catch (error) {
      this.loadingPromises.delete(name);
      console.warn(`Failed to load image: ${name}`, error);
      throw error;
    }
  }

  private async tryLoadWithExtensions(basePath: string, extensions: string[], name: string): Promise<HTMLImageElement> {
    for (const ext of extensions) {
      try {
        const image = await this.loadSingleImage(`${basePath}${ext}`);
        console.log(`Loaded ${name} with extension: ${ext}`);
        return image;
      } catch (error) {
        // Continue to next extension
        continue;
      }
    }
    throw new Error(`Could not load image ${name} with any of the provided extensions`);
  }

  private loadSingleImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  public getImage(name: string): HTMLImageElement | null {
    return this.images.get(name) || null;
  }

  public isImageLoaded(name: string): boolean {
    return this.images.has(name);
  }

  public preloadImages(configs: AssetConfig[]): Promise<HTMLImageElement[]> {
    const promises = configs.map(config => this.loadImage(config));
    return Promise.all(promises);
  }

  public clearCache(): void {
    this.images.clear();
    this.loadingPromises.clear();
    console.log('Asset cache cleared');
  }

  // Convenience methods for common background images
  public async loadMainMenuBackground(): Promise<HTMLImageElement> {
    return this.loadImage({
      name: 'main-menu-background',
      basePath: '/assets/images/main-menu-01',
      extensions: this.defaultExtensions
    });
  }

  public async loadLevelSelectBackground(): Promise<HTMLImageElement> {
    return this.loadImage({
      name: 'level-select-background',
      basePath: '/assets/images/level-select-01',
      extensions: this.defaultExtensions
    });
  }

  public async loadGameplayBackground(): Promise<HTMLImageElement> {
    return this.loadImage({
      name: 'gameplay-background',
      basePath: '/assets/images/gameplay-01',
      extensions: this.defaultExtensions
    });
  }

  // Fallback to main menu background if specific background doesn't exist
  public async loadBackgroundWithFallback(primaryConfig: AssetConfig, fallbackName: string = 'main-menu-background'): Promise<HTMLImageElement> {
    try {
      console.log(`Attempting to load primary background: ${primaryConfig.name} from ${primaryConfig.basePath}`);
      const image = await this.loadImage(primaryConfig);
      console.log(`✅ Successfully loaded primary background: ${primaryConfig.name}`);
      return image;
    } catch (error) {
      console.warn(`❌ Primary background failed (${primaryConfig.name}), falling back to: ${fallbackName}`);
      const fallbackImage = this.getImage(fallbackName);
      if (fallbackImage) {
        console.log(`✅ Using cached fallback background: ${fallbackName}`);
        return fallbackImage;
      }
      // If fallback also doesn't exist, try to load main menu background
      console.log(`🔄 Loading fallback background: ${fallbackName}`);
      return this.loadMainMenuBackground();
    }
  }

  // Load boxcar image for train cars
  public async loadBoxcarImage(): Promise<HTMLImageElement> {
    return this.loadImage({
      name: 'boxcar',
      basePath: '/assets/images/boxcar-01',
      extensions: ['.png']
    });
  }

  // Utility method to draw image with white background removal
  public drawImageWithoutWhiteBackground(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    threshold: number = 240 // RGB values above this are considered "white"
  ): void {
    // Create a temporary canvas to process the image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    // Draw the original image to temp canvas
    tempCtx.drawImage(image, 0, 0);

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;

    // Remove white background by making white pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If pixel is close to white, make it transparent
      if (r > threshold && g > threshold && b > threshold) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Put the modified image data back
    tempCtx.putImageData(imageData, 0, 0);

    // Draw the processed image to the main canvas
    ctx.drawImage(tempCanvas, dx, dy, dw, dh);
  }

  // Alternative method using CSS blend modes (simpler but less control)
  public drawImageWithBlendMode(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void {
    // Save current context state
    ctx.save();

    // Set blend mode to multiply (this will make white transparent)
    ctx.globalCompositeOperation = 'multiply';

    // Draw the image
    ctx.drawImage(image, dx, dy, dw, dh);

    // Restore context state
    ctx.restore();
  }

  // Draw image with color tinting (to match train car colors)
  public drawImageWithColorTint(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    tintColor: string,
    threshold: number = 240
  ): void {
    // First draw the image without white background
    this.drawImageWithoutWhiteBackground(ctx, image, dx, dy, dw, dh, threshold);

    // Then apply color tint using blend mode
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = tintColor;
    ctx.fillRect(dx, dy, dw, dh);
    ctx.restore();
  }
}
