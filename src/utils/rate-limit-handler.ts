// Rate limiting handler with exponential backoff
export interface RateLimitOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
}

export async function withRateLimitHandling<T>(
    apiCall: () => Promise<T>,
    options: RateLimitOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error: any) {
            lastError = error;

            // If it's not a rate limit error, throw immediately
            if (!error.message?.includes('Rate limit') && !error.message?.includes('429')) {
                throw error;
            }

            // If this is the last attempt, throw the error
            if (attempt === maxRetries) {
                throw error;
            }

            // Wait with exponential backoff
            console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Exponential backoff with jitter
            delay = Math.min(delay * 2 + Math.random() * 1000, maxDelay);
        }
    }

    throw lastError!;
}
