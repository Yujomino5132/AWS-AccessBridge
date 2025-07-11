# CFWorker-AWS-AccessBridge

## Deploy

```
npm install
```

Create a D1 database with the name `aws_access_bridge_db`

```
npx wrangler d1 create aws_access_bridge_db
```

...and update the database_id field in wrangler.json with the new database ID.

Run the following db migration to initialize the database (notice the migrations directory in this project):

```
npx wrangler d1 migrations apply --remote aws_access_bridge_db
```
