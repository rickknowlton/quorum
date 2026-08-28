export function dashboardPath() {
  return "/dashboard";
}

export function participantPath(publicId: string) {
  return `/q/${publicId}`;
}

export function adminPath(publicId: string, token?: string) {
  const path = `/q/${publicId}/admin`;
  return token ? `${path}?token=${encodeURIComponent(token)}` : path;
}

export function adminQuestionsPath(publicId: string, token?: string) {
  const path = `/q/${publicId}/admin/questions`;
  return token ? `${path}?token=${encodeURIComponent(token)}` : path;
}

export function editPath(publicId: string, token: string) {
  return `/q/${publicId}/edit?token=${encodeURIComponent(token)}`;
}

export function resultsPath(publicId: string) {
  return `/q/${publicId}/results`;
}

export function thanksPath(publicId: string) {
  return `/q/${publicId}/thanks`;
}
