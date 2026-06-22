import { SBTETProvider } from '../src/lib/sbtet/provider';

async function testVerification() {
  console.log("Starting local test...");
  const apiClient = SBTETProvider.getApiClient();
  
  try {
    const pin = "24054-AI-061";
    console.log(`Testing PIN: ${pin}`);
    const studentInfo = await apiClient.verifyStudent(pin);
    console.log("SUCCESS:", studentInfo);
  } catch (error: any) {
    console.error("FAILED:");
    console.error(error.stack || error.message || error);
  }
}

testVerification();
