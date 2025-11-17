import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ScopeStatus } from "../components/ScopeStatus";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const scopes = session.scope ? session.scope.split(",") : [];

  return {
    shop: session.shop,
    scopes,
    accessToken: session.accessToken || "",
    tokenPreview: session.accessToken
      ? session.accessToken.substring(0, 10) + "..."
      : "Not available",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Get the form data to determine the action
  const formData = await request.formData();
  const action = formData.get("action");

  // Action to sync access token to external API
  if (action === "sync-token") {
    try {
      const accessToken = session.accessToken || "";
      const shop = session.shop;
      const scopes = session.scope ? session.scope.split(",") : [];

      // Replace with your actual API endpoint
      // const apiEndpoint =
      //   process.env.EXTERNAL_API_ENDPOINT || "https://your-api.com/sync-token";

      // const syncResponse = await fetch(apiEndpoint, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${process.env.API_SECRET_KEY || "your-api-secret"}`,
      //   },
      //   body: JSON.stringify({
      //     shop: shop,
      //     accessToken: accessToken,
      //     scopes: scopes,
      //     expiresAt: session.expires,
      //     timestamp: new Date().toISOString(),
      //   }),
      // });

      // if (!syncResponse.ok) {
      //   throw new Error(`API sync failed: ${syncResponse.statusText}`);
      // }

      // const syncResult = await syncResponse.json();

      const tokenDetails = `Access Token: ${accessToken}, Shop: ${shop}, Scopes: ${scopes.join(", ")}, Expires: ${session.expires || "N/A"}, Timestamp: ${new Date().toISOString()}`;

      return {
        success: true,
        message: "Access token synced successfully",
        syncResult: tokenDetails,
        shop,
        tokenPreview: accessToken.substring(0, 10) + "...",
      };
    } catch (error) {
      console.error("Error syncing access token:", error);
      return {
        success: false,
        message: "Failed to sync access token",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Original product creation action
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

const SKULENS_APP_URL = "http://localhost:5175";

export default function Index() {
  const { shop, scopes, accessToken, tokenPreview } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const requiredScopes = [
    "read_all_orders",
    "read_products",
    "read_customers",
    "read_orders",
    "read_inventory",
  ];
  const missingScopes = requiredScopes.filter((s) => !(scopes?.includes(s)));
  console.log(scopes,"scope"); 
  // const productId = fetcher.data?.product?.id?.replace(
  //   "gid://shopify/Product/",
  //   "",
  // );

  // useEffect(() => {
  //   if (productId) {
  //     shopify.toast.show("Product created");
  //   }
  // }, [productId, shopify]);

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Access token synced successfully");
    } else if (fetcher.data?.success === false) {
      shopify.toast.show("Failed to sync access token", { isError: true });
    }
  }, [fetcher.data, shopify]);

  // const generateProduct = () => fetcher.submit({}, { method: "POST" });
  const handleConnectToSkulens = () => {
    // Extract shop name without .myshopify.com suffix
    const shopName = shop.replace(/\.myshopify\.com$/, "");
    const params = new URLSearchParams({
      shopifyToken: accessToken,
      shopName: shopName,
    });
    const url = `${SKULENS_APP_URL}/?${params.toString()}`;
    window.open(url, "_blank");
  };


  return (
    <s-page heading="Skulens Shopify App">
      {/* <s-button slot="primary-action" onClick={generateProduct}>
        Generate a product
      </s-button> */}

      <ScopeStatus currentScopes={scopes || []} requiredScopes={requiredScopes} />

      {/* <s-section heading="Congrats on creating a new Shopify app 🎉">
        <s-paragraph>
          This embedded app template uses{" "}
          <s-link
            href="https://shopify.dev/docs/apps/tools/app-bridge"
            target="_blank"
          >
            App Bridge
          </s-link>{" "}
          interface examples like an{" "}
          <s-link href="/app/additional">additional page in the app nav</s-link>
          , as well as an{" "}
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
          >
            Admin GraphQL
          </s-link>{" "}
          mutation demo, to provide a starting point for app development.
        </s-paragraph>
      </s-section> */}

      {/* <s-section heading="Get started with products"> */}
        {/* <s-paragraph>
          Generate a product with GraphQL and get the JSON output for that
          product. Learn more about the{" "}
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
            target="_blank"
          >
            productCreate
          </s-link>{" "}
          mutation in our API references.
        </s-paragraph> */}
        {/* <s-stack direction="inline" gap="base">
          <s-button
            onClick={generateProduct}
            {...(isLoading &&
            fetcher.formData?.get("action") !== "sync-token"
              ? { loading: true }
              : {})}
          >
            Generate a product
          </s-button>
          {fetcher.data?.product && (
            <s-button
              onClick={() => {
                shopify.intents.invoke?.("edit:shopify/Product", {
                  value: fetcher.data?.product?.id,
                });
              }}
              target="_blank"
              variant="tertiary"
            >
              Edit product
            </s-button>
          )}
        </s-stack> */}
        {/* {fetcher.data?.product && (
          <s-section heading="productCreate mutation">
            <s-stack direction="block" gap="base">
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <pre style={{ margin: 0 }}>
                  <code>{JSON.stringify(fetcher.data.product, null, 2)}</code>
                </pre>
              </s-box>

              <s-heading>productVariantsBulkUpdate mutation</s-heading>
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <pre style={{ margin: 0 }}>
                  <code>{JSON.stringify(fetcher.data.variant, null, 2)}</code>
                </pre>
              </s-box>
            </s-stack>
          </s-section>
        )} */}
      {/* </s-section> */}

      <s-section heading="Access Token Management">
        {missingScopes.length > 0 && (
          <div style={{ border: "1px solid #e03e3e", background: "#fdecec", borderRadius: 8, marginBottom: 12 }}>
            <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
              <s-heading>Permissions needed</s-heading>
              <s-paragraph>
                <s-text>It looks like the app doesn’t have all the required permissions yet. Missing:</s-text>
              </s-paragraph>
              <s-unordered-list>
                {missingScopes.map((scope) => (
                  <s-list-item key={scope}>{scope}</s-list-item>
                ))}
              </s-unordered-list>
              <s-paragraph>
                <s-text>Please update the app’s access scopes and reinstall the app to grant access.</s-text>
              </s-paragraph>
            </s-box>
          </div>
        )}
        <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
          <s-heading>Store Access</s-heading>
          <s-stack direction="block" gap="base">
            <s-paragraph>
              <s-text>Shop: {shop}</s-text>
            </s-paragraph>
            <s-paragraph>
              <s-text>Scopes: {scopes?.join(", ") || "None"}</s-text>
            </s-paragraph>
            {/* <s-paragraph>
              <s-text>Access Token: {tokenPreview}</s-text>
            </s-paragraph> */}
          </s-stack>
        </s-box>

        <div style={{ height: 12 }}></div>
        <s-stack direction="inline" gap="base">
          <s-button
            onClick={handleConnectToSkulens}
            {...(isLoading &&
            fetcher.formData?.get("action") === "sync-token"
              ? { loading: true }
              : {})}
            disabled={missingScopes.length > 0}
            variant="primary"
          >
            Connect to Skulens
          </s-button>
        </s-stack>

        {fetcher.data?.success && (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-text>✅ {fetcher.data.message}</s-text>
            {fetcher.data.syncResult && (
              <s-paragraph>
                <s-text>
                  API Response: {JSON.stringify(fetcher.data.syncResult)}
                </s-text>
              </s-paragraph>
            )}
          </s-box>
        )}

        {fetcher.data?.success === false && (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-text>❌ {fetcher.data.message}</s-text>
            <s-paragraph>
              <s-text>Error: {fetcher.data.error}</s-text>
            </s-paragraph>
          </s-box>
        )}
      </s-section>

      <s-section slot="aside" heading="App template specs">
        <s-paragraph>
          <s-text>Framework: </s-text>
          <s-link href="https://reactrouter.com/" target="_blank">
            React Router
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Interface: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/app-home/using-polaris-components"
            target="_blank"
          >
            Polaris web components
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>API: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
          >
            GraphQL
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Database: </s-text>
          <s-link href="https://www.prisma.io/" target="_blank">
            Prisma
          </s-link>
        </s-paragraph>
      </s-section>

      {/* <s-section slot="aside" heading="Next steps">
        <s-unordered-list>
          <s-list-item>
            Build an{" "}
            <s-link
              href="https://shopify.dev/docs/apps/getting-started/build-app-example"
              target="_blank"
            >
              example app
            </s-link>
          </s-list-item>
          <s-list-item>
            Explore Shopify&apos;s API with{" "}
            <s-link
              href="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
              target="_blank"
            >
              GraphiQL
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section> */}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
