type CacheEntry<T> = {
    value: T;
    expiry: number;
};

class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();

    /**
     * Get value from cache
     * @param key Cache key
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Set value in cache
     * @param key Cache key
     * @param value Value to store
     * @param ttlSeconds Time to live in seconds
     */
    set(key: string, value: any, ttlSeconds: number = 60): void {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiry });
    }

    /**
     * Delete value from cache
     * @param key Cache key
     */
    del(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Flush all keys starting with a prefix
     * @param prefix Key prefix
     */
    flush(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
    }
}

export const cacheService = new CacheService();
