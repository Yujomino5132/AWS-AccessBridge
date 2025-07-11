# AWS Access Bridge

![AWS Access Bridge](https://raw.githubusercontent.com/Rexezuge-CloudflareWorkers/AWS-AccessBridge-Assets/refs/heads/main/pictures/1.png)

A secure, web-based AWS role assumption bridge built on Cloudflare Workers that simplifies AWS multi-account access management. This application provides a centralized interface for users to assume AWS roles across multiple accounts and generate AWS Console URLs with temporary credentials.

## Overview

AWS Access Bridge is a full-stack application that consists of:

- **Backend API**: Built with Hono framework running on Cloudflare Workers
- **Frontend Web App**: React-based SPA with Tailwind CSS styling
- **Database**: Cloudflare D1 for storing credentials and role mappings
- **Authentication**: User-based access control for role assumptions

### Key Features

- **Role Assumption**: Securely assume AWS roles across multiple accounts
- **Console URL Generation**: Generate temporary AWS Console login URLs
- **User Management**: Email-based user authentication and authorization
- **Role Mapping**: Configure which users can assume which roles
- **Credential Chaining**: Support for complex role assumption chains
- **OpenAPI Documentation**: Auto-generated API documentation at `/docs`

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │───▶│ Cloudflare       │───▶│   AWS STS       │
│   (Frontend)    │    │ Workers API      │    │   (Role         │
│                 │    │ (Backend)        │    │   Assumption)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Cloudflare D1  │
                       │   (Database)     │
                       └──────────────────┘
```

## API Endpoints

- `POST /api/aws/console` - Generate AWS Console URL with temporary credentials
- `POST /api/aws/assume-role` - Assume an AWS role and return temporary credentials
- `GET /api/user/assumables` - List roles that the current user can assume
- `GET /api/user/me` - Get current user information
- `GET /docs` - OpenAPI documentation

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers and D1 enabled
- Wrangler CLI installed globally: `npm install -g wrangler`
- AWS accounts and roles configured for cross-account access

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Cloudflare D1 Database

Create a new D1 database:

```bash
npx wrangler d1 create aws_access_bridge_db
```

Update the `database_id` field in `wrangler.jsonc` with the new database ID returned from the command above.

### 3. Run Database Migrations

Initialize the database schema:

```bash
npx wrangler d1 migrations apply --remote aws_access_bridge_db
```

This creates two tables:
- `credentials`: Stores AWS credentials and role chains
- `assumable_roles`: Maps users to roles they can assume

### 4. Configure Environment

Update `wrangler.jsonc` with your specific configuration:

```jsonc
{
  "name": "your-worker-name",
  "d1_databases": [
    {
      "binding": "AccessBridgeDB",
      "database_name": "aws_access_bridge_db",
      "database_id": "your-database-id"
    }
  ]
}
```

### 5. Build and Deploy

Build the frontend application:

```bash
npm run buildApp
```

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

The deployment process includes:
1. Installing dependencies
2. Code formatting and linting
3. Building the React frontend
4. Deploying to Cloudflare Workers

## Development

### Project Structure

```
├── src/                    # Backend API source code
│   ├── dao/               # Data Access Objects
│   ├── endpoints/         # API route handlers
│   ├── error/            # Error handling
│   ├── model/            # Data models and types
│   ├── utils/            # Utility functions
│   └── index.ts          # Main application entry
├── app/                   # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   └── App.tsx       # Main app component
│   └── package.json      # Frontend dependencies
├── migrations/           # Database migration files
├── wrangler.jsonc       # Cloudflare Workers configuration
└── package.json         # Backend dependencies and scripts
```

### Local Development

1. **Start the development server:**
   ```bash
   npx wrangler dev
   ```

2. **Build the frontend in watch mode:**
   ```bash
   cd app && npm run build -- --watch
   ```

3. **Run database migrations locally:**
   ```bash
   npx wrangler d1 migrations apply --local aws_access_bridge_db
   ```

### Available Scripts

**Root level:**
- `npm run buildApp` - Build the React frontend
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run prettier` - Format code
- `npm run lint` - Lint TypeScript code

**Frontend (app/):**
- `npm run build` - Build for production
- `npm run release` - Clean and build
- `npm run prettier` - Format frontend code
- `npm run lint` - Lint frontend code

### Database Schema

**credentials table:**
```sql
CREATE TABLE credentials (
    principal_arn VARCHAR(256) PRIMARY KEY,
    assumed_by VARCHAR(256),
    access_key_id VARCHAR(128),
    secret_access_key VARCHAR(256),
    session_token VARCHAR(2048)
);
```

**assumable_roles table:**
```sql
CREATE TABLE assumable_roles (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    role_name VARCHAR(128),
    PRIMARY KEY (user_email, aws_account_id, role_name)
);
```

### Configuration Management

1. **Add AWS Credentials**: Insert base AWS credentials into the `credentials` table
2. **Configure User Access**: Add user email and role mappings to `assumable_roles` table
3. **Set up Role Chains**: Configure complex role assumption chains in the credentials table

### Testing

Run the linter and formatter:

```bash
npm run prettier
npm run lint
```

### Technology Stack

**Backend:**
- [Hono](https://hono.dev/) - Fast web framework for Cloudflare Workers
- [Chanfana](https://chanfana.pages.dev/) - OpenAPI framework for Hono
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [aws4fetch](https://github.com/mhart/aws4fetch) - AWS request signing
- TypeScript for type safety

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS for styling
- Vite for build tooling

**Infrastructure:**
- Cloudflare Workers for serverless compute
- Cloudflare D1 for SQL database
- Cloudflare Pages for static asset hosting

## Security Considerations

- All AWS credentials are stored securely in Cloudflare D1
- User authentication is required for all role assumptions
- Role access is controlled via database mappings
- Temporary credentials have limited lifespans
- All API requests are validated and sanitized

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run linting and formatting: `npm run prettier && npm run lint`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/Rexezuge-CloudflareWorkers/AWS-AccessBridge).
