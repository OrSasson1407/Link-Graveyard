# Prisma Migrations

This project uses `prisma migrate dev` for schema changes.

## Development workflow
```bash
# After editing prisma/schema.prisma:
npx prisma migrate dev --name <description>

# Apply in CI/production:
npx prisma migrate deploy

# Never use db push in production — it skips migration history.
```

## Current migration history
Run `npx prisma migrate status` to see applied migrations.