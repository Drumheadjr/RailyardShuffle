# GitHub Pages Deployment Guide

## Overview

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. The setup includes proper base path handling, asset management, and build optimization for static hosting.

## Automatic Deployment Setup

### 1. Repository Configuration

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"

2. **Repository Name**:
   - Ensure your repository is named `railyard-shuffle` (or update the base path in `vite.config.ts`)
   - The deployed URL will be: `https://yourusername.github.io/railyard-shuffle/`

### 2. GitHub Actions Workflow

The `.github/workflows/deploy.yml` file handles automatic deployment:

- **Triggers**: Pushes to `main` or `master` branch
- **Process**: 
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies
  4. Run type checking
  5. Build for production
  6. Deploy to GitHub Pages

### 3. Build Configuration

#### Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/railyard-shuffle/" : "/",
  // ... other config
});
```

#### Asset Path Handling (`src/utils/AssetManager.ts`)
The AssetManager automatically handles different base paths:
- **Development**: `/assets/images/...`
- **Production**: `/railyard-shuffle/assets/images/...`

## Manual Deployment

### Local Build and Deploy
```bash
# Build for GitHub Pages
npm run build:gh-pages

# Deploy using gh-pages (requires gh-pages package)
npm run deploy
```

### Prerequisites for Manual Deployment
```bash
# Install gh-pages if not already installed
npm install --save-dev gh-pages
```

## File Structure Changes

### Added Files
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `public/.nojekyll` - Prevents Jekyll processing
- `src/vite-env.d.ts` - Vite environment types
- `docs/github-pages-deployment.md` - This guide

### Modified Files
- `vite.config.ts` - Added base path configuration
- `package.json` - Added deployment scripts and gh-pages dependency
- `src/utils/AssetManager.ts` - Updated asset path handling
- `src/game/LevelSelectScene.ts` - Updated asset paths
- `README.md` - Added deployment documentation

## Asset Management

### Path Handling
All asset paths are automatically adjusted based on environment:

```typescript
// Development
/assets/images/main-menu-01.png

// Production (GitHub Pages)
/railyard-shuffle/assets/images/main-menu-01.png
```

### Supported Assets
- **Images**: PNG, JPG, JPEG, WebP, GIF
- **Audio**: (Future implementation)
- **Fonts**: (Future implementation)

## Troubleshooting

### Common Issues

1. **404 Errors on Assets**:
   - Check that asset paths don't start with `/` in the code
   - Verify the base path in `vite.config.ts` matches your repository name

2. **Blank Page After Deployment**:
   - Check browser console for JavaScript errors
   - Verify the script tag in `dist/index.html` has the correct base path

3. **Build Failures**:
   - Run `npm run type-check` locally to catch TypeScript errors
   - Check GitHub Actions logs for detailed error messages

### Debugging Steps

1. **Local Production Build**:
   ```bash
   npm run build:gh-pages
   npm run preview
   ```

2. **Check Generated Files**:
   ```bash
   # Verify base paths in generated HTML
   cat dist/index.html
   
   # Check if .nojekyll exists
   ls -la dist/
   ```

3. **Test Asset Loading**:
   - Open browser developer tools
   - Check Network tab for failed asset requests
   - Verify asset URLs include the base path

## Customization

### Changing Repository Name
If you rename the repository, update the base path in:
1. `vite.config.ts` - Change `/railyard-shuffle/` to `/your-repo-name/`
2. `src/utils/AssetManager.ts` - Update the production path

### Adding Custom Domain
If using a custom domain:
1. Add a `CNAME` file to the `public/` directory
2. Update the base path to `/` in `vite.config.ts`

## Performance Optimizations

### Build Optimizations
- **Tree Shaking**: Unused code is automatically removed
- **Minification**: JavaScript and CSS are minified
- **Asset Optimization**: Images and other assets are optimized
- **Gzip Compression**: GitHub Pages automatically serves gzipped content

### Loading Optimizations
- **Lazy Loading**: Assets are loaded on demand
- **Caching**: Proper cache headers for static assets
- **Fallback Handling**: Graceful degradation when assets fail to load

## Security Considerations

- **HTTPS**: GitHub Pages automatically serves content over HTTPS
- **CSP**: Consider adding Content Security Policy headers
- **Asset Integrity**: All assets are served from the same origin

## Monitoring

### Deployment Status
- Check GitHub Actions tab for deployment status
- Monitor the "Pages" section in repository settings

### Performance Monitoring
- Use browser developer tools to monitor loading times
- Check Core Web Vitals for user experience metrics

The deployment is now fully automated and optimized for GitHub Pages hosting!
