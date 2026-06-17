import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  async fetchGithubPrStatus(url: string): Promise<Record<string, any>> {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return {};

    const owner = match[1];
    const repo = match[2];
    const prNumber = match[3];
    this.logger.log(
      "Fetching GitHub PR status: " + owner + "/" + repo + "#" + prNumber,
    );

    try {
      const apiUrl =
        "https://api.github.com/repos/" +
        owner +
        "/" +
        repo +
        "/pulls/" +
        prNumber;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: "Bearer " + process.env.GITHUB_TOKEN,
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) return {};
      const data = await response.json();

      return {
        pr_status: data.state?.toUpperCase(),
        language: data.head?.repo?.language,
        pr_title: data.title,
        merged: data.merged,
      };
    } catch (err) {
      this.logger.error("GitHub fetch failed: " + err.message);
      return {};
    }
  }

  async fetchProductPrice(url: string): Promise<Record<string, any>> {
    this.logger.log("Fetching product price for: " + url);
    return { price_available: false };
  }
}
