import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Webhook handler for mandatory compliance webhooks
 * Handles: customers/data_request, customers/redact, shop/redact
 * 
 * Reference: https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  // authenticate.webhook automatically verifies HMAC and returns 401 if invalid
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    switch (topic) {
      case "customers/data_request":
        return await handleDataRequest(payload, shop);
      
      case "customers/redact":
        return await handleCustomerRedact(payload, shop);
      
      case "shop/redact":
        return await handleShopRedact(payload, shop);
      
      default:
        console.warn(`Unknown compliance webhook topic: ${topic}`);
        return new Response(null, { status: 200 });
    }
  } catch (error) {
    console.error(`Error processing ${topic} webhook:`, error);
    // Always return 200 to acknowledge receipt, even if processing fails
    return new Response(null, { status: 200 });
  }
};

/**
 * Handle customers/data_request webhook
 * Customer has requested their data - provide it to the store owner within 30 days
 */
async function handleDataRequest(payload: any, shop: string) {
  const {
    shop_id,
    shop_domain,
    orders_requested,
    customer,
    data_request,
  } = payload;

  console.log("Data request details:", {
    shop_id,
    shop_domain,
    customer_id: customer?.id,
    customer_email: customer?.email,
    orders_requested,
    data_request_id: data_request?.id,
  });

  // TODO: Implement data retrieval logic
  // You need to:
  // 1. Retrieve all customer data associated with the customer ID and email
  // 2. Retrieve all order data for the orders_requested IDs
  // 3. Provide this data to the store owner (not directly to the customer)
  // 4. Complete this within 30 days of receiving the request

  // Example implementation:
  // const customerData = await db.customer.findMany({ where: { shop, email: customer.email } });
  // const orderData = await db.order.findMany({ where: { shop, orderId: { in: orders_requested } } });
  // await sendDataToStoreOwner(shop, customerData, orderData);

  return new Response(null, { status: 200 });
}

/**
 * Handle customers/redact webhook
 * Store owner has requested deletion of customer data - delete/redact within 30 days
 */
async function handleCustomerRedact(payload: any, shop: string) {
  const {
    shop_id,
    shop_domain,
    customer,
    orders_to_redact,
  } = payload;

  console.log("Customer redact request details:", {
    shop_id,
    shop_domain,
    customer_id: customer?.id,
    customer_email: customer?.email,
    customer_phone: customer?.phone,
    orders_to_redact,
  });

  // TODO: Implement data redaction/deletion logic
  // You need to:
  // 1. Delete or redact all customer data associated with the customer ID and email
  // 2. Delete or redact all order data for the orders_to_redact IDs
  // 3. Complete this within 30 days of receiving the request
  // 4. Note: If legally required to retain data, you may not complete the redaction

  // Example implementation:
  // await db.customer.deleteMany({ where: { shop, email: customer.email } });
  // await db.order.deleteMany({ where: { shop, orderId: { in: orders_to_redact } } });

  return new Response(null, { status: 200 });
}

/**
 * Handle shop/redact webhook
 * App was uninstalled 48 hours ago - delete all shop data
 */
async function handleShopRedact(payload: any, shop: string) {
  const {
    shop_id,
    shop_domain,
  } = payload;

  console.log("Shop redact request details:", {
    shop_id,
    shop_domain,
  });

  // Delete all shop-related data from your database
  // This includes shop configuration, settings, and any data associated with this shop
  
  // Delete session data (if not already deleted by app/uninstalled webhook)
  await db.session.deleteMany({ where: { shop } });

  // TODO: Delete any other shop-specific data from your database
  // Examples:
  // - Shop settings: await db.shopSettings.deleteMany({ where: { shop } });
  // - Shop configurations: await db.shopConfig.deleteMany({ where: { shop } });
  // - Shop-specific API keys or tokens
  // - Any other data associated with shop_id or shop_domain

  console.log(`Successfully redacted data for shop: ${shop}`);

  return new Response(null, { status: 200 });
}

