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

3. Your application will be available at `https://<username>.github.io/calunga-ui-demo/`

### Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is pre-configured with:
- `BASE_URL: /calunga-ui-demo/` - Update this if your repository has a different name
- `NODE_ENV: development` - Enables EJS template processing during build
- Automatic deployment to GitHub Pages

## Manual Deployment

To build the application manually for GitHub Pages:

```bash
# Build with GitHub Pages configuration
NODE_ENV=development BASE_URL=/calunga-ui-demo/ npm run build

# The built files will be in client/dist/
```

## Custom Domain

To use a custom domain:

1. Add a `CNAME` file to `client/public/` with your domain name
2. Configure your domain's DNS settings to point to GitHub Pages
3. Update the `BASE_URL` in `.github/workflows/deploy.yml` to `/`

## How It Works

The GitHub Pages deployment uses the same build process as rhtas-console-ui:

1. **Base Path Configuration**: Vite's `base` option is set via `BASE_URL` environment variable
2. **EJS Template Processing**: `NODE_ENV=development` enables ViteEjsPlugin to process templates
3. **React Router**: The basename is automatically set from `import.meta.env.BASE_URL`
4. **Static Assets**: All assets are correctly prefixed with the base URL path

## Troubleshooting

If the application doesn't load correctly:

1. Verify the `BASE_URL` in the workflow matches your repository name (with leading and trailing slashes)
2. Check that GitHub Pages is enabled and set to use GitHub Actions
3. Review the Actions tab for build/deployment errors
4. Ensure your browser isn't caching an old version (hard refresh)
