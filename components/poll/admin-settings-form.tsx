import {
  setPollStatusAction,
  updatePollSettingsAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label, Textarea } from "@/components/ui/fields";
import { Card } from "@/components/ui/shell";
import { formatDateTimeLocal, timezoneLabel } from "@/lib/dates/format";
import type { PollWithDetails } from "@/lib/polls/queries";

export function AdminSettingsForm({
  poll,
  token,
}: {
  poll: PollWithDetails;
  token?: string;
}) {
  const update = updatePollSettingsAction.bind(null, poll.publicId, token);
  const close = setPollStatusAction.bind(null, poll.publicId, token, "closed");
  const reopen = setPollStatusAction.bind(null, poll.publicId, token, "open");

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold">Poll settings</h2>
        <form action={update} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="admin-title">Title</Label>
            <Input id="admin-title" name="title" defaultValue={poll.title} required />
          </div>
          <div>
            <Label htmlFor="admin-description">Description</Label>
            <Textarea
              id="admin-description"
              name="description"
              defaultValue={poll.description ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="admin-deadline">Response deadline (optional)</Label>
            <Input
              id="admin-deadline"
              name="deadlineAt"
              type="datetime-local"
              defaultValue={
                poll.deadlineAt ? formatDateTimeLocal(poll.deadlineAt, poll.timezone) : ""
              }
            />
            <Hint>Uses {timezoneLabel(poll.timezone)}. Leave blank for no deadline.</Hint>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="allowResponseEditing"
              className="size-4 accent-accent"
              defaultChecked={poll.allowResponseEditing}
            />
            Allow participants to edit responses
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showParticipantNames"
              className="size-4 accent-accent"
              defaultChecked={poll.showParticipantNames}
            />
            Show participant names to others
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showResults"
              className="size-4 accent-accent"
              defaultChecked={poll.showResults}
            />
            Show results to participants
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="allowMaybe"
              className="size-4 accent-accent"
              defaultChecked={poll.allowMaybe}
            />
            Allow “If needed” on availability questions
          </label>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Poll status</h2>
        <p className="mt-1 text-sm text-muted">
          {poll.status === "open"
            ? "This poll is open and accepting responses."
            : "This poll is closed."}
        </p>
        <form action={poll.status === "open" ? close : reopen} className="mt-4">
          <Button type="submit" variant={poll.status === "open" ? "secondary" : "primary"}>
            {poll.status === "open" ? "Close poll" : "Reopen poll"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
