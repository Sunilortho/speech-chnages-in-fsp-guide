import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

// Vercel backend is the reliable production backend with ElevenLabs TTS support
const VERCEL_BACKEND = 'https://german-doctors-prep.vercel.app';

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  // Always use Vercel backend — it has ElevenLabs configured and working
  // EXPO_PUBLIC_RORK_API_BASE_URL is kept for local dev override only
  if (url && url !== VERCEL_BACKEND && process.env.NODE_ENV === 'development') {
    console.log("[TRPC] DEV: Using override URL:", url);
    return url;
  }

  console.log("[TRPC] Using Vercel backend:", VERCEL_BACKEND);
  return VERCEL_BACKEND;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
