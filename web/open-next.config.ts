import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config: ISR pages are served from the build; add an R2 incremental
// cache binding here when on-demand revalidation needs to persist.
export default defineCloudflareConfig();
