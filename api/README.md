# SBTET FastAPI Proxy Gateway

This FastAPI gateway is required because the Telangana SBTET API (`sbtet.telangana.gov.in`) aggressively blocks incoming connections from major cloud provider data centers outside of India (specifically Vercel's Washington DC servers).

By deploying this gateway on a platform like **Railway** or **Render**, we can route our Next.js backend requests through this proxy, bypassing the IP block.

## Railway Deployment Instructions

1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select this `diplomaiq` repository.
4. Once deployed, Railway will try to build the Next.js app by default. We need to tell it to ONLY build and run the FastAPI app.
5. Go to your Railway project's **Settings**.
6. Under **Build**:
   - Change the **Root Directory** to `/api`.
   - Ensure the **Builder** is set to `Nixpacks` (it will automatically detect the `requirements.txt` and `main.py`).
7. Under **Variables**, you do not need to add anything (no database required).
8. Under **Networking**, click **Generate Domain** to get a public URL for this FastAPI app (e.g., `sbtet-gateway.up.railway.app`).
9. Once the deployment succeeds, go to that URL and append `/health`. It should return `{"status":"ok","service":"SBTET API Gateway"}`.

## Connecting Vercel to Railway

1. Copy the Railway public URL.
2. Go to your **Vercel** project dashboard -> **Settings** -> **Environment Variables**.
3. Add a new variable:
   - **Key**: `FASTAPI_URL`
   - **Value**: `https://your-railway-app.up.railway.app` (replace with your actual Railway domain. DO NOT include a trailing slash).
4. Redeploy your Vercel app so the new environment variable takes effect.
5. Your Next.js app will now proxy all SBTET requests through the Railway gateway!
