# AWS Access Bridge

![AWS Access Bridge](https://raw.githubusercontent.com/Rexezuge-CloudflareWorkers/AWS-AccessBridge-Assets/refs/heads/main/pictures/2.jpg)

A secure, web-based AWS role assumption bridge built on Cloudflare Workers that simplifies AWS multi-account access management. This application provides a centralized interface for users to assume AWS roles across multiple accounts and generate AWS Console URLs with temporary credentials.

## Overview

AWS Access Bridge is a full-stack application that consists of:

- **Backend API**: Built with Hono framework running on Cloudflare Workers
- **Frontend Web App**: React 19-based SPA with Tailwind CSS v4 styling
- **Database**: Cloudflare D1 with encrypted credential storage
- **Authentication**: Cloudflare Zero Trust integration for secure access control
- **Security**: AES-GCM encryption for sensitive credential data

### Key Features

- **Role Assumption**: Securely assume AWS roles across multiple accounts
- **Console URL Generation**: Generate temporary AWS Console login URLs
- **User Management**: Email-based user authentication via Cloudflare Zero Trust
- **Role Mapping**: Configure which users can assume which roles
- **Account Management**: AWS account nicknames and user favorites
- **Credential Encryption**: AES-GCM encrypted storage of AWS credentials
- **Admin Interface**: Administrative endpoints for credential and crypto management
- **OpenAPI Documentation**: Auto-generated API documentation at `/docs`

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React 19 SPA  │───▶│ Cloudflare       │───▶│   AWS STS       │
│   (Frontend)    │    │ Workers API      │    │   (Role         │
│   + Tailwind v4 │    │ (Hono + Chanfana)│    │   Assumption)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Cloudflare D1  │
                       │   (Encrypted DB) │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Cloudflare Zero  │
                       │ Trust (Auth)     │
                       └──────────────────┘
```

## API Endpoints

### AWS Operations

- `POST /api/aws/console` - Generate AWS Console URL with temporary credentials
- `POST /api/aws/assume-role` - Assume an AWS role and return temporary credentials

### User Operations

- `GET /api/user/me` - Get current user information
- `GET /api/user/assumables` - List roles that the current user can assume
- `GET /api/user/favorites` - Get user's favorite AWS accounts
- `POST /api/user/favorites` - Add account to favorites
- `DELETE /api/user/favorites` - Remove account from favorites

### Admin Operations

- `POST /api/admin/credentials/store-credential` - Store AWS credentials
- `POST /api/admin/rotate-master-key` - Initialize/rotate the encryption key

### Documentation

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
npx wrangler d1 create aws-access-bridge-db
```

Update the `database_id` field in `wrangler.jsonc` with the new database ID returned from the command above.

### 4. Create Cloudflare Secrets Store

Create a secrets store for encryption keys:

```bash
npx wrangler secret-store create aws-access-bridge-secrets
```

Create the AES encryption key secret:

```bash
# Create the secret (you'll be prompted to enter the key value)
npx wrangler secret-store put aws-access-bridge-aes-encryption-key --store-id YOUR_STORE_ID

# Call the rotate-master-key endpoint to initialize the encryption key
curl -X POST https://your-worker-domain.workers.dev/api/admin/rotate-master-key
```

Update the `store_id` field in `wrangler.jsonc` with your secrets store ID.

### 5. Run Database Migrations

Initialize the database schema:

```bash
npx wrangler d1 migrations apply --remote aws-access-bridge-db
```

This creates the following tables:

- `credentials`: Stores encrypted AWS credentials and role chains
- `assumable_roles`: Maps users to roles they can assume
- `aws_accounts`: Stores AWS account nicknames
- `user_favorite_accounts`: Tracks user's favorite accounts

### 6. Configure Environment

Update `wrangler.jsonc` with your specific configuration:

```jsonc
{
  "name": "aws-access-bridge",
  "d1_databases": [
    {
      "binding": "AccessBridgeDB",
      "database_name": "aws-access-bridge-db",
      "database_id": "your-database-id",
    },
  ],
  "secrets_store_secrets": [
    {
      "binding": "AES_ENCRYPTION_KEY_SECRET",
      "store_id": "your-secrets-store-id",
      "secret_name": "aws-access-bridge-aes-encryption-key",
    },
  ],
  "vars": {
    "POLICY_AUD": "your-cloudflare-zero-trust-application-aud",
    "TEAM_DOMAIN": "https://your-team.cloudflareaccess.com",
  },
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
2. Store the credentials using the API endpoint:

```bash
curl -X POST https://your-worker-domain.workers.dev/api/admin/credentials/store-credential \
  -H "Content-Type: application/json" \
  -d '{
    "principal_arn": "arn:aws:iam::<your-aws-account>:user/DO-NOT-DELETE-Federated-SSO-AccessBridge",
    "access_key_id": "YOUR_ACCESS_KEY_ID",
    "secret_access_key": "YOUR_SECRET_ACCESS_KEY"
  }'
```

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
│   │   └── api/          # API endpoints
│   │       ├── admin/    # Admin operations
│   │       ├── aws/      # AWS operations
│   │       └── user/     # User operations
│   ├── error/            # Error handling
│   ├── model/            # Data models and types
│   ├── utils/            # Utility functions
│   ├── crypto/           # Encryption utilities
│   ├── workers/          # Worker implementations
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
- `npm run tsc` - Type check without emitting files
- `npm run cf-typegen` - Generate Cloudflare Worker types

**Frontend (app/):**

- `npm run build` - Build for production
- `npm run release` - Clean and build
- `npm run prettier` - Format frontend code
- `npm run lint` - Lint frontend code
- `npm run cf-typegen` - Generate Cloudflare Worker types

### Database Schema

**credentials table:**

```sql
CREATE TABLE credentials (
    principal_arn VARCHAR(256) PRIMARY KEY,
    assumed_by VARCHAR(256),
    encrypted_access_key_id VARCHAR(128),
    encrypted_secret_access_key VARCHAR(256),
    encrypted_session_token VARCHAR(2048),
    salt VARCHAR(128)
);
```

**assumable_roles table:**

```sql
CREATE TABLE assumable_roles (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    role_name VARCHAR(128),
    PRIMARY KEY (user_email, aws_account_id, role_name),
    FOREIGN KEY (aws_account_id) REFERENCES aws_accounts(aws_account_id)
);
```

**aws_accounts table:**

```sql
CREATE TABLE aws_accounts (
    aws_account_id CHAR(12) PRIMARY KEY,
    aws_account_nickname VARCHAR(255)
);
```

**user_favorite_accounts table:**

```sql
CREATE TABLE user_favorite_accounts (
    user_email VARCHAR(120),
    aws_account_id CHAR(12),
    PRIMARY KEY (user_email, aws_account_id),
    FOREIGN KEY (aws_account_id) REFERENCES aws_accounts(aws_account_id)
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
- Tailwind CSS v4 for styling
- Vite for build tooling

**Infrastructure:**

- Cloudflare Workers for serverless compute
- Cloudflare D1 for SQL database
- Cloudflare Zero Trust for authentication
- Cloudflare Secrets Store for secure key management

## Security Considerations

- Application is protected by Cloudflare Zero Trust authentication
- All AWS credentials are encrypted using AES-GCM and stored securely in Cloudflare D1
- User authentication is required for all role assumptions
- Role access is controlled via database mappings
- Temporary credentials have limited lifespans
- All API requests are validated and sanitized
- Encryption keys are stored in Cloudflare Secrets Store

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
