import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  private readonly AFFILIATE_DOMAINS: Record<string, string> = {
    "amazon.com": process.env.AMAZON_AFFILIATE_TAG || "",
    "amazon.co.uk": process.env.AMAZON_AFFILIATE_TAG || "",
  };

  rewriteUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace("www.", "");

      if (this.AFFILIATE_DOMAINS[domain]) {
        parsed.searchParams.set("tag", this.AFFILIATE_DOMAINS[domain]);
        this.logger.log("Rewrote affiliate URL for domain: " + domain);
        return parsed.toString();
      }
    } catch (err) {
      this.logger.error("Failed to rewrite URL: " + err.message);
    }
    return url;
  }

  isAffiliateDomain(url: string): boolean {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace("www.", "");
      return domain in this.AFFILIATE_DOMAINS;
    } catch {
      return false;
    }
  }
}
