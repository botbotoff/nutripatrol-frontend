import type { Identifier } from "react-admin";
import type { Flag, TicketIssue } from "../dataProvider";
import { flagReasonLabel } from "./flags";
import { flavorChoices, typeChoices } from "./choices";
import { productUrl } from "./flavorUrls";

/** Where moderators open issues about how Open Food Facts computes things. */
export const ISSUE_REPOSITORY = "openfoodfacts/openfoodfacts-server";

/**
 * GitHub answers 414 past roughly 8 kB of URL, and browsers start truncating
 * long before some proxies do; 6000 characters leaves room for both.
 */
const MAX_NEW_ISSUE_URL_LENGTH = 6000;

/** Report comments are shortened to the first of these that fits. */
const COMMENT_LENGTHS = [Infinity, 1000, 400, 150, 0];

interface IssueTicket {
  id: Identifier;
  barcode: string | null;
  type: string;
  flavor: string;
  url: string | null;
}

function choiceName(choices: { id: string; name: string }[], id: string) {
  return choices.find((choice) => choice.id === id)?.name ?? id;
}

function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return length === 0 ? "…" : `${text.slice(0, length)}…`;
}

/** The page of the ticket in NutriPatrol, for the issue to link back to. */
export function ticketPageUrl(ticketId: Identifier) {
  return `${window.location.origin}/tickets/${ticketId}/show`;
}

function issueBody(
  ticket: IssueTicket,
  flags: Flag[],
  commentLength: number,
): string {
  const lines: string[] = [
    `Reported on NutriPatrol: ${ticketPageUrl(ticket.id)}`,
    "",
  ];
  if (ticket.barcode) {
    lines.push(
      `- Product: [${ticket.barcode}](${productUrl(ticket.flavor, ticket.barcode)})`,
    );
  } else if (ticket.url) {
    lines.push(`- URL: ${ticket.url}`);
  }
  lines.push(
    `- Project: ${choiceName(flavorChoices, ticket.flavor)}`,
    `- Report type: ${choiceName(typeChoices, ticket.type)}`,
    "",
    "## Problem",
    "",
    "<!-- What Open Food Facts computes, and what it should compute instead. -->",
    "",
    "## Reports",
    "",
  );

  // Reporters are left out on purpose: the issue is public, and who flagged
  // the product is not needed to fix how it is computed.
  flags.forEach((flag, index) => {
    const reason = flagReasonLabel(flag.reason) ?? "No reason given";
    lines.push(
      `### ${index + 1}. ${reason}`,
      "",
      `- Reported on ${flag.created_at.slice(0, 10)}, from ${flag.source}`,
    );
    if (flag.product_revision != null) {
      lines.push(`- Product revision at the time: ${flag.product_revision}`);
    }
    if (flag.comment && commentLength > 0) {
      lines.push(
        "",
        ...truncate(flag.comment.trim(), commentLength)
          .split("\n")
          .map((line) => `> ${line}`),
      );
    }
    if (flag.extra_data && Object.keys(flag.extra_data).length > 0) {
      lines.push(
        "",
        "```json",
        JSON.stringify(flag.extra_data, null, 2),
        "```",
      );
    }
    lines.push("");
  });
  return lines.join("\n");
}

function issueTitle(ticket: IssueTicket, flags: Flag[]) {
  const reasons = [
    ...new Set(flags.map((flag) => flagReasonLabel(flag.reason)).filter(Boolean)),
  ];
  const about = ticket.barcode ? ` on ${ticket.barcode}` : "";
  return `${reasons.join(", ") || "Reported issue"}${about}`;
}

/**
 * GitHub's "new issue" page on openfoodfacts-server, pre-filled with what the
 * ticket's reports say.
 *
 * The moderator reviews and submits it themselves, then pastes the issue's
 * URL back into the ticket. Long report comments are shortened until the URL
 * fits; the full text stays on the ticket, which the issue links to.
 */
export function newIssueUrl(ticket: IssueTicket, flags: Flag[]): string {
  const base = `https://github.com/${ISSUE_REPOSITORY}/issues/new`;
  const title = issueTitle(ticket, flags);
  let url = base;
  for (const length of COMMENT_LENGTHS) {
    const params = new URLSearchParams({
      title,
      body: issueBody(ticket, flags, length),
    });
    url = `${base}?${params.toString()}`;
    if (url.length <= MAX_NEW_ISSUE_URL_LENGTH) return url;
  }
  // Even without comments, too many reports: keep the link back to the ticket
  // and as much of the rest as fits.
  const params = new URLSearchParams({ title });
  const room = MAX_NEW_ISSUE_URL_LENGTH - base.length - params.toString().length;
  let body = issueBody(ticket, flags, 0);
  while (body.length > 0 && encodeURIComponent(body).length > room - 10) {
    body = body.slice(0, Math.floor(body.length * 0.9));
  }
  params.set("body", `${body}\n…`);
  return `${base}?${params.toString()}`;
}

/** How an issue's state reads, in GitHub's own colours. */
export function issueStateDisplay(issue: TicketIssue): {
  label: string;
  color: string;
} {
  if (issue.state === "open") return { label: "Open", color: "#1a7f37" };
  if (issue.state === "closed") {
    if (issue.state_reason === "completed") {
      return { label: "Closed", color: "#8250df" };
    }
    return {
      label:
        issue.state_reason === "duplicate" ? "Duplicate" : "Not planned",
      color: "#59636e",
    };
  }
  return { label: "Unknown", color: "#9e9e9e" };
}
