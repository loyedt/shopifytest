import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Derive appUrl from environment variables
// Priority: SHOPIFY_APP_URL > RENDER_EXTERNAL_URL > construct from RENDER_SERVICE_URL
function getAppUrl(): string {
  if (process.env.SHOPIFY_APP_URL) {
    return process.env.SHOPIFY_APP_URL;
  }
  
  // Render provides RENDER_EXTERNAL_URL in production
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  // Fallback: construct from RENDER_SERVICE_URL if available
  if (process.env.RENDER_SERVICE_URL) {
    return process.env.RENDER_SERVICE_URL;
  }
  
  // If still not found, throw a helpful error
  throw new Error(
    "SHOPIFY_APP_URL environment variable is required. " +
    "Please set SHOPIFY_APP_URL to your app's public URL (e.g., https://your-app.onrender.com). " +
    "If deploying on Render, you can also set RENDER_EXTERNAL_URL or ensure SHOPIFY_APP_URL is configured in your environment variables."
  );
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: getAppUrl(),
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
