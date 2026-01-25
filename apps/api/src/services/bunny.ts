import { env } from "../lib/env";
import crypto from "crypto";

interface BunnyVideoResponse {
  guid: string;
  title: string;
  length: number;
  status: number;
  thumbnailFileName: string;
}

interface CreateVideoResponse {
  guid: string;
  uploadUrl: string;
}

const BUNNY_API_BASE = "https://video.bunnycdn.com/library";

function getBunnyHeaders(): Record<string, string> {
  if (!env.BUNNY_STREAM_API_KEY) {
    throw new Error("Bunny Stream API key not configured");
  }
  return {
    AccessKey: env.BUNNY_STREAM_API_KEY,
    "Content-Type": "application/json",
  };
}

export async function createVideo(title: string): Promise<CreateVideoResponse> {
  if (!env.BUNNY_STREAM_LIBRARY_ID) {
    throw new Error("Bunny Stream library ID not configured");
  }

  const response = await fetch(`${BUNNY_API_BASE}/${env.BUNNY_STREAM_LIBRARY_ID}/videos`, {
    method: "POST",
    headers: getBunnyHeaders(),
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create video: ${error}`);
  }

  const data = (await response.json()) as BunnyVideoResponse;

  return {
    guid: data.guid,
    uploadUrl: `${BUNNY_API_BASE}/${env.BUNNY_STREAM_LIBRARY_ID}/videos/${data.guid}`,
  };
}

export async function getVideo(videoId: string): Promise<BunnyVideoResponse | null> {
  if (!env.BUNNY_STREAM_LIBRARY_ID) {
    throw new Error("Bunny Stream library ID not configured");
  }

  const response = await fetch(`${BUNNY_API_BASE}/${env.BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`, {
    headers: getBunnyHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to get video");
  }

  return response.json() as Promise<BunnyVideoResponse>;
}

export async function deleteVideo(videoId: string): Promise<void> {
  if (!env.BUNNY_STREAM_LIBRARY_ID) {
    throw new Error("Bunny Stream library ID not configured");
  }

  const response = await fetch(`${BUNNY_API_BASE}/${env.BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`, {
    method: "DELETE",
    headers: getBunnyHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete video");
  }
}

export function generateSignedVideoUrl(videoId: string, expirationHours = 4): string {
  if (!env.BUNNY_STREAM_CDN_HOSTNAME || !env.BUNNY_STREAM_API_KEY) {
    throw new Error("Bunny Stream not configured");
  }

  const expirationTime = Math.floor(Date.now() / 1000) + expirationHours * 60 * 60;
  const path = `/${videoId}/playlist.m3u8`;

  const hashableBase = `${env.BUNNY_STREAM_API_KEY}${path}${expirationTime}`;
  const token = crypto.createHash("sha256").update(hashableBase).digest("hex");

  return `https://${env.BUNNY_STREAM_CDN_HOSTNAME}${path}?token=${token}&expires=${expirationTime}`;
}

export function generateThumbnailUrl(videoId: string): string {
  if (!env.BUNNY_STREAM_CDN_HOSTNAME) {
    throw new Error("Bunny Stream CDN hostname not configured");
  }
  return `https://${env.BUNNY_STREAM_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}

export function getUploadCredentials(videoId: string): { url: string; headers: Record<string, string> } {
  if (!env.BUNNY_STREAM_LIBRARY_ID) {
    throw new Error("Bunny Stream library ID not configured");
  }

  return {
    url: `${BUNNY_API_BASE}/${env.BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
    headers: getBunnyHeaders(),
  };
}
