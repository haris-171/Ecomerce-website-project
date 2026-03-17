# Ecommax MERN Storefront

Responsive MERN storefront inspired by the provided template. The frontend is React (Vite) and the backend is Express + MongoDB, ready for single-domain deployment on Vercel.

## Local setup

1. Install root dependencies:

```
npm install
```

2. Install client dependencies:

```
npm --prefix client install
```

3. Configure environment variables:

```
copy .env.example .env
```

4. Run the app:

```
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API requests to `http://localhost:3001`.

## API endpoints

- `GET /api/health`
- `GET /api/categories`
- `GET /api/products`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/orders` (auth required)
- `GET /api/orders/my` (auth required)
- `GET /api/admin/summary` (admin)
- `GET /api/admin/orders` (admin)
- `POST /api/seed` (requires `x-seed-key` header if `SEED_KEY` is set)

If `MONGODB_URI` is not set, the API serves sample data so the UI still renders.

## Vercel deployment

The `vercel.json` at the repo root builds the React app and serves the Express API as a serverless function on the same domain.

Quick deploy steps:

1. Import the repo in Vercel.
2. Keep the root directory as the project root.
3. Add environment variables below.
4. Deploy.

Set these environment variables in Vercel:

- `MONGODB_URI`
- `SEED_KEY` (optional)
- `JWT_SECRET`
- `ADMIN_EMAILS` (comma-separated list of admin accounts)

To seed the database after deployment, call:

```
POST /api/seed
Headers: x-seed-key: <SEED_KEY>
```
