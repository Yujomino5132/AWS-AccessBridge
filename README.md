# AWS Access Bridge

![AWS Access Bridge](https://raw.githubusercontent.com/Rexezuge-CloudflareWorkers/AWS-AccessBridge-Assets/refs/heads/main/pictures/2.jpg)

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
- Cloudflare account with Workers, D1, and Zero Trust enabled
- Wrangler CLI installed globally: `npm install -g wrangler`
- AWS accounts and roles configured for cross-account access
- Cloudflare Zero Trust team configured for application security

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate with Cloudflare

Authenticate Wrangler with your Cloudflare account:

```bash
npx wrangler login
```

### 3. Create Cloudflare D1 Database

Create a new D1 database:

```bash
npx wrangler d1 create aws_access_bridge_db
```

Update the `database_id` field in `wrangler.jsonc` with the new database ID returned from the command above.

### 4. Run Database Migrations

Initialize the database schema:

```bash
npx wrangler d1 migrations apply --remote aws_access_bridge_db
```

This creates two tables:

- `credentials`: Stores AWS credentials and role chains
- `assumable_roles`: Maps users to roles they can assume

### 5. Configure Environment

Update `wrangler.jsonc` with your specific configuration:

```jsonc
{
  "name": "your-worker-name",
  "d1_databases": [
    {
      "binding": "AccessBridgeDB",
      "database_name": "aws_access_bridge_db",
      "database_id": "your-database-id",
    },
  ],
}
```

### 6. Configure Cloudflare Zero Trust

Secure your application with Cloudflare Zero Trust:

1. **Create a Zero Trust Team**:
   - Go to [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/)
   - Create a new team if you don't have one
   - Note your team domain (e.g., `your-team.cloudflareaccess.com`)

2. **Create an Access Application**:
   - Navigate to Access > Applications
   - Click "Add an application" > "Self-hosted"
   - Configure the application:
     - **Application name**: AWS Access Bridge
     - **Subdomain**: Choose a subdomain for your app
     - **Domain**: Select your Cloudflare domain
     - **Path**: Leave blank to protect the entire application

3. **Configure Access Policies**:
   - Create policies to control who can access the application
   - Example policy for email-based access:
     - **Policy name**: Authorized Users
     - **Action**: Allow
     - **Include**: Emails - add authorized user email addresses
   - Save the policy and application

4. **Update Application Settings**:
   - Enable "Accept all available identity providers" or configure specific providers
   - Set session duration as needed (recommended: 8 hours)
   - Enable "HTTP-only cookies" for additional security

5. **Test Access**:
   - Navigate to your application URL
   - Verify that Zero Trust authentication is required
   - Ensure authorized users can access the application

### 7. Build and Deploy

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

## AWS IAM Setup

For security considerations, AWS Access Bridge implements an intermediate layer role assumption architecture. This setup requires creating specific IAM users and roles in your AWS account.

### 1. Create IAM User

Create an IAM user named `DO-NOT-DELETE-Federated-SSO-AccessBridge` with the following inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssumeIntermediateRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": ["arn:aws:iam::<your-aws-account>:role/DO-NOT-DELETE-AccessBridge-Intermediate"]
    }
  ]
}
```

### 2. Create Access Key Pair

1. Generate an access key pair for the IAM user created above
2. Store the credentials in the D1 database `credentials` table:
   - `principal_arn`: The ARN of the intermediate role
   - `access_key_id`: The access key ID
   - `secret_access_key`: The secret access key
   - `session_token`: Leave empty for permanent credentials

### 3. Create Intermediate IAM Role

Create an IAM role named `DO-NOT-DELETE-AccessBridge-Intermediate` with the following permissions policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssumeAnyRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": ["arn:aws:iam::<your-aws-account>:role/*"]
    }
  ]
}
```

And the following trust policy (replace `<your-aws-account>` with your actual AWS account ID):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<your-aws-account>:user/DO-NOT-DELETE-Federated-SSO-AccessBridge"
      },
      "Action": "sts:AssumeRole",
      "Condition": {}
    }
  ]
}
```

### 4. Configure Target Roles

For each role that users should be able to assume through Access Bridge, ensure the role's trust policy allows the intermediate role to assume it:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<your-aws-account>:role/DO-NOT-DELETE-AccessBridge-Intermediate"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Security Benefits

This intermediate layer approach provides several security advantages:

- **Credential Isolation**: The base IAM user has minimal permissions
- **Centralized Control**: All role assumptions go through the intermediate role
- **Audit Trail**: Clear separation between the bridge service and target roles
- **Reduced Attack Surface**: Limits the scope of potential credential compromise

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

- Application is protected by Cloudflare Zero Trust authentication
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
