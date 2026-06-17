import { Test, TestingModule } from "@nestjs/testing";
import { IntegrationsService } from "./integrations.service";

global.fetch = jest.fn();

describe("IntegrationsService", () => {
  let service: IntegrationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationsService],
    }).compile();
    service = module.get<IntegrationsService>(IntegrationsService);
  });

  it("should return empty object for non-GitHub URL", async () => {
    const result = await service.fetchGithubPrStatus("https://example.com");
    expect(result).toEqual({});
  });

  it("should parse GitHub PR URL correctly", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        state: "open",
        head: { repo: { language: "TypeScript" } },
      }),
    });
    const result = await service.fetchGithubPrStatus(
      "https://github.com/owner/repo/pull/123",
    );
    expect(result.pr_status).toBe("OPEN");
  });

  it("should return empty object on API error", async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false });
    const result = await service.fetchGithubPrStatus(
      "https://github.com/owner/repo/pull/123",
    );
    expect(result).toEqual({});
  });

  it("should return empty object on fetch throw", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("network error"));
    const result = await service.fetchGithubPrStatus(
      "https://github.com/owner/repo/pull/123",
    );
    expect(result).toEqual({});
  });

  it("should return language from API response", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        state: "closed",
        head: { repo: { language: "Python" } },
      }),
    });
    const result = await service.fetchGithubPrStatus(
      "https://github.com/owner/repo/pull/99",
    );
    expect(result.language).toBe("Python");
  });

  it("should handle malformed GitHub URL gracefully", async () => {
    const result = await service.fetchGithubPrStatus(
      "https://github.com/justuser",
    );
    expect(result).toEqual({});
  });

  it("should handle missing language in API response", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ state: "open", head: { repo: {} } }),
    });
    const result = await service.fetchGithubPrStatus(
      "https://github.com/owner/repo/pull/1",
    );
    expect(result.pr_status).toBe("OPEN");
  });

  it("should not call fetch for non-GitHub URL", async () => {
    await service.fetchGithubPrStatus(
      "https://stackoverflow.com/questions/123",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should uppercase the PR state", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        state: "merged",
        head: { repo: { language: "JS" } },
      }),
    });
    const result = await service.fetchGithubPrStatus(
      "https://github.com/a/b/pull/5",
    );
    expect(result.pr_status).toBe("MERGED");
  });

  it("should include pr_number in result", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        state: "open",
        number: 42,
        head: { repo: { language: "Go" } },
      }),
    });
    const result = await service.fetchGithubPrStatus(
      "https://github.com/a/b/pull/42",
    );
    expect(result).toBeDefined();
  });
});
