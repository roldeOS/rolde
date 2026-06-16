import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Link,
  Img,
} from "@react-email/components";
import { EMAIL_BRAND as B } from "./brand";

/**
 * The RolDe brand email shell (React Email — battle-tested cross-client HTML).
 * Every transactional email is this shell wrapped around DB-stored content, so
 * editors touch content, never markup.
 *
 * Dark mode (ported from mindate's 2026-06-15 fix): every colour-bearing element
 * is class-tagged so the `@media (prefers-color-scheme: dark)` block can override
 * it; Outlook.com / Outlook-Android ignore `@media`, so the `[data-ogsc]` /
 * `[data-ogsb]` selectors mirror the swap. Inline styles are the light fallback
 * for clients that strip `<style>`. Body text in dark is deliberately BRIGHT.
 */
export type RoldeEmailProps = {
  preheader: string;
  headline: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
  /** Year for the © line; defaults to a constant so renders are deterministic. */
  year?: number;
};

const DARK_CSS = `
@media (prefers-color-scheme: dark) {
  .r-page { background-color: ${B.darkPage} !important; }
  .r-card { background-color: ${B.darkCard} !important; border-color: ${B.darkDivider} !important; }
  .r-ink, .r-headline { color: ${B.darkInk} !important; }
  .r-body { color: ${B.darkBody} !important; }
  .r-muted { color: ${B.darkMuted} !important; }
  .r-divider { border-color: ${B.darkDivider} !important; }
  .r-cta { background-color: ${B.darkButton} !important; color: ${B.darkButtonText} !important; }
  .r-link { color: ${B.darkLink} !important; }
  .r-wordmark-light { display: none !important; }
  .r-wordmark-dark { display: inline-block !important; }
}
[data-ogsb] .r-page { background-color: ${B.darkPage} !important; }
[data-ogsb] .r-card { background-color: ${B.darkCard} !important; }
[data-ogsc] .r-ink, [data-ogsc] .r-headline { color: ${B.darkInk} !important; }
[data-ogsc] .r-body { color: ${B.darkBody} !important; }
[data-ogsc] .r-muted { color: ${B.darkMuted} !important; }
[data-ogsc] .r-link { color: ${B.darkLink} !important; }
`;

export function RoldeEmailShell({
  preheader,
  headline,
  paragraphs,
  ctaLabel,
  ctaUrl,
  footerNote,
  year = 2026,
}: RoldeEmailProps) {
  const hasPng = Boolean(B.wordmarkLightUrl && B.wordmarkDarkUrl);
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style dangerouslySetInnerHTML={{ __html: DARK_CSS }} />
      </Head>
      <Preview>{preheader}</Preview>
      <Body
        className="r-page"
        style={{ margin: 0, padding: 0, backgroundColor: B.page, fontFamily: B.font }}
      >
        {/* Full-width page table — the bg lives HERE (not just <body>) so dark mode
            reliably re-colours the whole page in Apple Mail / Outlook. */}
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          className="r-page"
          style={{ backgroundColor: B.page }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "40px 16px" }}>
                <Container
                  className="r-card"
                  style={{
                    maxWidth: 520,
                    margin: "0 auto",
                    backgroundColor: B.card,
                    borderRadius: 16,
                    border: `1px solid ${B.divider}`,
                    overflow: "hidden",
                  }}
                >
          {/* Wordmark + coral accent line */}
          <Section style={{ padding: "44px 48px 0", textAlign: "center" as const }}>
            {hasPng ? (
              <>
                <Img
                  className="r-wordmark-light"
                  src={B.wordmarkLightUrl}
                  alt="RolDe OS"
                  height={34}
                  style={{ height: 34, width: "auto", display: "inline-block" }}
                />
                <Img
                  className="r-wordmark-dark"
                  src={B.wordmarkDarkUrl}
                  alt="RolDe OS"
                  height={34}
                  style={{ height: 34, width: "auto", display: "none" }}
                />
              </>
            ) : (
              <Text
                className="r-ink"
                style={{
                  margin: 0,
                  fontFamily: "Georgia,'Times New Roman',serif",
                  fontSize: 34,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: B.ink,
                  lineHeight: 1,
                }}
              >
                RolDe OS
              </Text>
            )}
            <Section
              style={{
                height: 3,
                width: 34,
                margin: "14px auto 0",
                backgroundColor: B.heart,
                borderRadius: 2,
              }}
            />
          </Section>

          {/* Heading */}
          <Section style={{ padding: "28px 48px 0", textAlign: "center" as const }}>
            <Heading
              as="h1"
              className="r-headline"
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                color: B.ink,
                lineHeight: 1.3,
              }}
            >
              {headline}
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ padding: "14px 48px 0" }}>
            {paragraphs.map((p, i) => (
              <Text
                key={i}
                className="r-body"
                style={{
                  margin: i === paragraphs.length - 1 ? 0 : "0 0 10px",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: B.ink,
                }}
              >
                {p}
              </Text>
            ))}
          </Section>

          {/* CTA */}
          {ctaLabel && ctaUrl ? (
            <Section style={{ padding: "26px 48px 4px", textAlign: "center" as const }}>
              <Button
                className="r-cta"
                href={ctaUrl}
                style={{
                  backgroundColor: B.button,
                  borderRadius: 11,
                  color: B.buttonText,
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "14px 30px",
                }}
              >
                {ctaLabel}
              </Button>
            </Section>
          ) : null}

          {/* Optional small note */}
          {footerNote ? (
            <Section style={{ padding: "14px 48px 0", textAlign: "center" as const }}>
              <Text
                className="r-muted"
                style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: B.muted }}
              >
                {footerNote}
              </Text>
            </Section>
          ) : null}

          {/* Divider */}
          <Section style={{ padding: "22px 0 0" }}>
            <Hr className="r-divider" style={{ borderColor: B.divider, margin: "0 48px" }} />
          </Section>

          {/* Legal footer — stacked, all-black in light, dark-aware in dark */}
          <Section style={{ padding: "22px 48px 28px", textAlign: "center" as const }}>
            <Text className="r-ink" style={{ margin: 0, fontSize: 12, color: B.ink }}>
              Made with <span style={{ color: B.heart }}>&#9829;</span> at RolDe
            </Text>
            <Text className="r-muted" style={{ margin: "9px 0 0", fontSize: 11, color: B.ink }}>
              &copy; {year} RolDe Ltd
            </Text>
            <Text className="r-muted" style={{ margin: "3px 0 0", fontSize: 11, color: B.ink }}>
              {B.regLine}
            </Text>
            <Text
              className="r-muted"
              style={{ margin: "3px 0 0", fontSize: 11, lineHeight: 1.5, color: B.ink }}
            >
              {B.addressLine1}
              <br />
              {B.addressLine2}
            </Text>
            <Text className="r-muted" style={{ margin: "12px 0 0", fontSize: 11, color: B.ink }}>
              <Link
                className="r-link"
                href={`${B.siteUrl}/policy/privacy`}
                style={{ color: B.ink, textDecoration: "none" }}
              >
                Privacy
              </Link>
              <span className="r-muted" style={{ color: B.muted }}>{" · "}</span>
              <Link
                className="r-link"
                href={`${B.siteUrl}/policy/terms`}
                style={{ color: B.ink, textDecoration: "none" }}
              >
                Terms
              </Link>
              <span className="r-muted" style={{ color: B.muted }}>{" · "}</span>
              <Link
                className="r-link"
                href={`mailto:${B.contactEmail}`}
                style={{ color: B.ink, textDecoration: "none" }}
              >
                Contact
              </Link>
            </Text>
          </Section>
                </Container>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

export default RoldeEmailShell;
