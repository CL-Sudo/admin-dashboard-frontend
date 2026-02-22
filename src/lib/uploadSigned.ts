export async function uploadToSupabaseSignedUrl(opts: {
  signedUrl: string;
  file: File;
}) {
  const res = await fetch(opts.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': opts.file.type },
    body: opts.file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Upload failed (${res.status}): ${text || res.statusText}`
    );
  }
}
