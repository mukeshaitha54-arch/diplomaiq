from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import time
import logging
import json

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("sbtet_gateway")

app = FastAPI(title="SBTET API Gateway")

# Allow CORS for Next.js frontend and Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted to the Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PinRequest(BaseModel):
    pin: str

async def fetch_sbtet_url(url: str):
    start_time = time.time()
    logger.info(f"SBTET REQUEST: GET {url}")
    
    try:
        # Use httpx with 8 second timeout and verify=False to bypass SSL issues
        async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
            response = await client.get(url)
            
            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"SBTET RESPONSE: Status {response.status_code} in {duration_ms}ms")
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail=f"SBTET API returned status {response.status_code}")
                
            try:
                # Sometimes the API returns a stringified JSON string inside the JSON
                data = response.json()
                if isinstance(data, str):
                    data = json.loads(data)
                return data
            except json.JSONDecodeError:
                # Fallback if the response is not valid JSON
                text = response.text
                if not text or "404" in text or "<html" in text:
                    return {"Table": []}
                raise HTTPException(status_code=502, detail="Failed to parse JSON from SBTET API")
                
    except httpx.TimeoutException:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(f"SBTET TIMEOUT in {duration_ms}ms")
        raise HTTPException(status_code=504, detail="Connection to SBTET timed out after 8 seconds")
    except Exception as e:
        logger.error(f"SBTET ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SBTET API Gateway"}

@app.post("/academic-results")
async def get_academic_results(req: PinRequest):
    url = f"https://sbtet.telangana.gov.in/api/api/Results/GetConsolidatedResults?Pin={req.pin}"
    return await fetch_sbtet_url(url)

@app.post("/verify-student")
async def verify_student(req: PinRequest):
    # Verify uses the consolidated results endpoint to get the student info
    url = f"https://sbtet.telangana.gov.in/api/api/Results/GetConsolidatedResults?Pin={req.pin}"
    return await fetch_sbtet_url(url)

@app.post("/attendance")
async def get_attendance(req: PinRequest):
    url = f"https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin={req.pin}"
    return await fetch_sbtet_url(url)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
