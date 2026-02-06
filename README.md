# Calunga UI Demo - Trusted Developer Libraries

A React-based web application demo.

## Quick Start

```bash
# Install dependencies
npm ci

# Start development server
npm run start:dev
```

The application will be available at http://localhost:3000

## Project Structure

This is a monorepo with the following workspaces:

- `common/` - Shared ESM module for environment config and branding
- `client/` - React frontend application
- `server/` - Express.js production server

## Tech Stack

- React 19
- TypeScript
- PatternFly 6 (design system)
- Rsbuild (build tool)
- TanStack Query (data fetching)
- React Router 7

## Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

The key variables to configure are:

| Variable | Description | Default |
|---|---|---|
| `PULP_API_URL` | Pulp server URL | `http://localhost:24817` |
| `PULP_USERNAME` | Pulp service account username | `admin` |
| `PULP_PASSWORD` | Pulp service account password | `password` |
| `PULP_VERIFY_SSL` | Verify SSL certs for Pulp connections | `true` |

### Pulp credentials

If you already have the Pulp CLI configured, you can re-use those credentials. They are
stored in `~/.config/pulp/cli.toml` (or the path set by `PULP_CLI_CONFIG`):

```toml
[cli]
base_url = "https://packages.redhat.com/api/pulp/calunga-ui-dev/"
username = "myuser"
password = "mytoken"
verify_ssl = false
```

Copy the `base_url`, `username`, `password`, and `verify_ssl` values into your `.env` file
as `PULP_API_URL`, `PULP_USERNAME`, `PULP_PASSWORD`, and `PULP_VERIFY_SSL` respectively.

See `.env.example` for the full list of available options.

## Available Scripts

- `npm run start:dev` - Start development server
- `npm run build` - Build all workspaces
- `npm run check` - Lint and format check
- `npm run test` - Run tests
