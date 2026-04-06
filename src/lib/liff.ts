import liff from '@line/liff';

export const initLiff = async (liffId: string) => {
  if (!liffId || 
      liffId === 'MY_LIFF_ID' || 
      liffId === 'undefined' || 
      liffId === 'null' ||
      liffId.trim() === '' ||
      liffId.includes('YOUR_')) {
    console.warn('LIFF ID is missing or placeholder. Skipping initialization.');
    return;
  }
  try {
    // Timeout for LIFF init to prevent hanging
    const initPromise = liff.init({ liffId });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('LIFF init timeout')), 5000)
    );

    await Promise.race([initPromise, timeoutPromise]);
    console.log('LIFF Initialized successfully');
  } catch (error) {
    // Only log if it's a real error, not just a missing ID or timeout
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage === 'LIFF init timeout') {
      console.warn('LIFF Initialization timed out (likely due to network or invalid ID)');
    } else if (errorMessage.includes('Failed to fetch')) {
      // "Failed to fetch" usually means the LIFF ID is invalid or network is blocked
      console.warn('LIFF Initialization failed (Failed to fetch). This often happens if the LIFF ID is invalid or the environment is restricted.');
    } else {
      console.warn('LIFF Initialization failed:', errorMessage);
    }
  }
};

export const getLiffProfile = async () => {
  if (liff.isLoggedIn()) {
    return await liff.getProfile();
  }
  return null;
};
