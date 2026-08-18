/**
 * Error thrown when an analysis provider is invoked but not configured.
 */
export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
    Object.setPrototypeOf(this, ProviderConfigurationError.prototype);
  }
}
