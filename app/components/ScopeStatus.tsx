interface ScopeStatusProps {
  readonly currentScopes: string[];
  readonly requiredScopes: string[];
}

export function ScopeStatus({ currentScopes, requiredScopes }: ScopeStatusProps) {
  const grantedScopes = requiredScopes.filter((scope) =>
    currentScopes.includes(scope)
  );
  const missingScopes = requiredScopes.filter(
    (scope) => !currentScopes.includes(scope)
  );

  const grantedCount = grantedScopes.length;
  const missingCount = missingScopes.length;
  const totalCount = requiredScopes.length;

  return (
    <s-section heading="Permissions Status">
      {missingCount > 0 && (
        <div style={{ border: "1px solid #e03e3e", background: "#fdecec", borderRadius: 8, marginBottom: 12 }}>
          <s-box padding="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-paragraph>
                <s-text>
                  <strong style={{ color: "#e03e3e" }}>Permissions needed</strong>
                </s-text>
              </s-paragraph>
              <s-paragraph>
                <s-text>
                  Please update the app's access scopes and reinstall the app to grant access.
                </s-text>
              </s-paragraph>
            </s-stack>
          </s-box>
        </div>
      )}
      <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text>
              <strong>{grantedCount}</strong> out of <strong>{totalCount}</strong> required permissions granted
            </s-text>
          </s-paragraph>
          <s-paragraph>
            <s-text>
              <strong>Granted ({grantedCount}):</strong> {grantedScopes.length > 0 ? grantedScopes.join(", ") : "None"}
            </s-text>
          </s-paragraph>
          {missingCount > 0 && (
            <s-paragraph>
              <s-text>
                <strong style={{ color: "#e03e3e" }}>Missing ({missingCount}):</strong>{" "}
                <span style={{ color: "#e03e3e" }}>{missingScopes.join(", ")}</span>
              </s-text>
            </s-paragraph>
          )}
        </s-stack>
      </s-box>
    </s-section>
  );
}

