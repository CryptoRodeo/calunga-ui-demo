# GitHub Pages Deployment

This document explains how to deploy the Calunga UI application to GitHub Pages.

## Automatic Deployment

The project includes a GitHub Actions workflow that automatically builds and deploys the application to GitHub Pages when changes are pushed to the `main` branch.

### Setup

1. Enable GitHub Pages in your repository settings:
   - Go to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**

2. Push your code to the `main` branch. The workflow will automatically:
   - Build the application with the correct base path
   - Deploy it to GitHub Pages

3. Your application will be available at `https://<username>.github.io/calunga-ui/`

### Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is pre-configured with:
- `PUBLIC_PATH: /calunga-ui-demo/` - Update this if your repository has a different name
- Build optimizations for static hosting
- Automatic deployment to GitHub Pages

## Manual Deployment

To build the application manually for GitHub Pages:

```bash
# Build with GitHub Pages configuration
NODE_ENV=production PUBLIC_PATH=/calunga-ui-demo/ GITHUB_PAGES=true npm run build

# The built files will be in client/dist/
```

## Custom Domain

To use a custom domain:

1. Add a `CNAME` file to `client/public/` with your domain name
2. Configure your domain's DNS settings to point to GitHub Pages
3. Update the `PUBLIC_PATH` in `.github/workflows/deploy.yml` to `/`

## How It Works

The GitHub Pages deployment includes several features to support single-page applications:

1. **Base Path Configuration**: Assets are served from the correct subdirectory
2. **Client-Side Routing**: A `404.html` redirect enables SPA routing
3. **Static Build**: Uses a simplified template without server-side rendering
4. **Jekyll Bypass**: Includes `.nojekyll` to prevent Jekyll processing

## Troubleshooting

If the application doesn't load correctly:

1. Verify the `PUBLIC_PATH` in the workflow matches your repository name
2. Check that GitHub Pages is enabled and set to use GitHub Actions
3. Review the Actions tab for build/deployment errors
4. Ensure your browser isn't caching an old version (hard refresh)
