export function resolveSubmitMode(formToken: string | undefined, tokenMatchesParticipant: boolean) {
  if (formToken) {
    return tokenMatchesParticipant ? "edit" : "invalid-edit-link";
  }
  return tokenMatchesParticipant ? "edit" : "create";
}
