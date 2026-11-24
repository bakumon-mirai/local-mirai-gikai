import { describe, expect, it } from "vitest";
import { toSafeExternalUrl } from "./safe-url";

describe("toSafeExternalUrl", () => {
  it("http / https URL のみ許可する", () => {
    expect(toSafeExternalUrl("https://example.lg.jp/minutes/1")).toBe(
      "https://example.lg.jp/minutes/1"
    );
    expect(toSafeExternalUrl("http://example.lg.jp/doc.pdf")).toBe(
      "http://example.lg.jp/doc.pdf"
    );
  });

  it("javascript: / data: / 空文字 / 不正 URL を拒否する", () => {
    expect(toSafeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeExternalUrl("JAVASCRIPT:alert(1)")).toBeNull();
    expect(
      toSafeExternalUrl("data:text/html,<script>alert(1)</script>")
    ).toBeNull();
    expect(toSafeExternalUrl("ftp://example.com/a")).toBeNull();
    expect(toSafeExternalUrl("/relative/path")).toBeNull();
    expect(toSafeExternalUrl("")).toBeNull();
    expect(toSafeExternalUrl(null)).toBeNull();
    expect(toSafeExternalUrl(undefined)).toBeNull();
  });
});
