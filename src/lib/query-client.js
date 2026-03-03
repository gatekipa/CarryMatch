import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 30 * 1000, // 30s default stale time to reduce redundant fetches
		},
		mutations: {
			onError: (error) => {
				// Global fallback error handler for mutations without their own onError
				const message = error?.message || 'Something went wrong. Please try again.';
				toast.error(message);
				console.error('[Mutation Error]', error);
			},
		},
	},
});