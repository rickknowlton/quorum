import { deleteParticipantAction } from "@/app/actions/admin";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Card } from "@/components/ui/shell";
import type { PollWithDetails } from "@/lib/polls/queries";

export function ParticipantList({
  poll,
  token,
}: {
  poll: PollWithDetails;
  token?: string;
}) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Participants</h2>
      {poll.participants.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No responses yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {poll.participants.map((participant) => (
            <li key={participant.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{participant.name}</p>
                <p className="text-sm text-muted">
                  {participant.responses.length}{" "}
                  {participant.responses.length === 1 ? "answer" : "answers"}
                </p>
              </div>
              <ConfirmAction
                label="Delete"
                confirmLabel="Delete response"
                description={`Remove ${participant.name}'s response? This cannot be undone.`}
                formAction={deleteParticipantAction.bind(
                  null,
                  poll.publicId,
                  token,
                  participant.id,
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
