export default function handler(_req: any, res: any) {
  const hasClientId = Boolean(process.env.YOUTUBE_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.YOUTUBE_CLIENT_SECRET);
  const hasRedirectUri = Boolean(process.env.YOUTUBE_REDIRECT_URI);

  return res.status(200).json({
    configured: hasClientId && hasClientSecret && hasRedirectUri,
    requiredScopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ],
    missing: [
      ...(!hasClientId ? ["YOUTUBE_CLIENT_ID"] : []),
      ...(!hasClientSecret ? ["YOUTUBE_CLIENT_SECRET"] : []),
      ...(!hasRedirectUri ? ["YOUTUBE_REDIRECT_URI"] : []),
    ],
  });
}
