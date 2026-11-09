import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Link,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useDataProvider,
  useNotify,
  usePermissions,
  useRecordContext,
  type FieldProps,
} from "react-admin";
import type { Identifier } from "react-admin";
import type { NutriPatrolDataProvider, TicketIssue } from "../dataProvider";
import { useFlagsByTicketIds } from "./flags";
import { issueStateDisplay, ISSUE_REPOSITORY, newIssueUrl } from "./githubIssues";

interface Ticket {
  id: Identifier;
  barcode: string | null;
  type: string;
  flavor: string;
  url: string | null;
  issues?: TicketIssue[];
}

/** The state of an issue, as a chip in GitHub's colours. */
export function IssueStateChip({ issue }: { issue: TicketIssue }) {
  const { label, color } = issueStateDisplay(issue);
  return (
    <Chip
      size="small"
      label={label}
      sx={{ bgcolor: color, color: "#fff", fontWeight: 500 }}
    />
  );
}

/** "#1234 Title of the issue", linking to it on GitHub. */
export function IssueLink({ issue }: { issue: TicketIssue }) {
  return (
    <Link href={issue.url} target="_blank" rel="noopener noreferrer">
      #{issue.number}
      {issue.title ? ` ${issue.title}` : ""}
    </Link>
  );
}

/**
 * For moderators: open a pre-filled issue on GitHub, then paste its URL back.
 *
 * GitHub does the creating, under the moderator's own account; NutriPatrol
 * only records the link.
 */
function LinkIssueForm({ ticket }: { ticket: Ticket }) {
  const dataProvider = useDataProvider<NutriPatrolDataProvider>();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const [url, setUrl] = useState("");
  const { data: flagsByTicket } = useFlagsByTicketIds([ticket.id]);
  const flags = flagsByTicket?.[String(ticket.id)] ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: () => dataProvider.linkTicketIssue(ticket.id, url.trim()),
    onSuccess: () => {
      setUrl("");
      // The section's list, the ticket's chips, and the history.
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error) => notify((error as Error).message, { type: "error" }),
  });

  return (
    <Stack spacing={1}>
      <Box>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<GitHubIcon />}
          component="a"
          href={newIssueUrl(ticket, flags)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open GitHub issue
        </Button>
      </Box>
      <Stack
        component="form"
        direction="row"
        spacing={1}
        alignItems="flex-start"
        onSubmit={(event: React.FormEvent) => {
          event.preventDefault();
          if (url.trim()) mutate();
        }}
      >
        <TextField
          size="small"
          label="Issue URL"
          placeholder={`https://github.com/${ISSUE_REPOSITORY}/issues/…`}
          helperText="Once the issue is created, paste its URL here."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={isPending || !url.trim()}
          sx={{ mt: 0.5 }}
        >
          Link issue
        </Button>
      </Stack>
    </Stack>
  );
}

/**
 * The GitHub issues linked to the ticket, for when a report comes from how
 * Open Food Facts computes something. Reporters see them too: the issues are
 * public, and they say what happens next.
 */
export function TicketIssuesSection() {
  const record = useRecordContext<Ticket>();
  const dataProvider = useDataProvider<NutriPatrolDataProvider>();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { permissions } = usePermissions();
  const isModerator = permissions === "moderator";

  const { data, isPending, isError } = useQuery({
    queryKey: ["tickets", record?.id, "issues"],
    queryFn: () => dataProvider.getTicketIssues(record!.id),
    enabled: record != null,
  });
  const unlink = useMutation({
    mutationFn: (issueId: number) =>
      dataProvider.unlinkTicketIssue(record!.id, issueId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
    onError: (error) => notify((error as Error).message, { type: "error" }),
  });

  if (!record) return null;
  const issues = data ?? [];

  return (
    <Stack spacing={2}>
      {isPending ? (
        <Skeleton variant="rectangular" height={40} />
      ) : isError ? (
        <Typography color="text.disabled">
          The issues could not be loaded.
        </Typography>
      ) : issues.length === 0 ? (
        <Typography color="text.disabled">
          No GitHub issue is linked to this ticket.
        </Typography>
      ) : (
        <Stack spacing={1} divider={<Divider flexItem />}>
          {issues.map((issue) => (
            <Stack
              key={issue.id}
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <IssueStateChip issue={issue} />
              <Box flexGrow={1}>
                <IssueLink issue={issue} />
              </Box>
              {isModerator && (
                <Tooltip title="Unlink this issue">
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Unlink issue #${issue.number}`}
                      disabled={unlink.isPending}
                      onClick={() => unlink.mutate(issue.id)}
                    >
                      <LinkOffIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          ))}
        </Stack>
      )}
      {isModerator && <LinkIssueForm ticket={record} />}
    </Stack>
  );
}

/** The linked issues' states in the ticket list, as last checked. */
export function TicketIssuesField(_props: FieldProps) {
  const record = useRecordContext<Ticket>();
  const issues = record?.issues ?? [];
  if (issues.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {issues.map((issue) => (
        <Tooltip
          key={issue.id}
          title={issue.title ? `#${issue.number} ${issue.title}` : `#${issue.number}`}
        >
          <Chip
            size="small"
            icon={<GitHubIcon sx={{ "&&": { color: "#fff" } }} />}
            label={`#${issue.number}`}
            component="a"
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            sx={{
              bgcolor: issueStateDisplay(issue).color,
              color: "#fff",
              "&:hover": { bgcolor: issueStateDisplay(issue).color, opacity: 0.85 },
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
}
