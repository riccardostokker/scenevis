import type { components } from "./schema";

export type Preview = components["schemas"]["Preview"];
export type Analysis = components["schemas"]["Analysis"];
export type Problem = components["schemas"]["Problem"];
export type CaptureMetadata = components["schemas"]["CaptureMetadata"];
export type ImageMetadata = components["schemas"]["ImageMetadata"];
export type MetadataEntry = components["schemas"]["MetadataEntry"];

export async function createPreview(file: File): Promise<Preview> {
  const form = new FormData();
  form.append("image", file);
  return request<Preview>("/api/previews", form);
}

export async function createAnalysis(file: File, regions: unknown): Promise<Analysis> {
  const form = new FormData();
  form.append("image", file);
  form.append("regions", JSON.stringify(regions));
  return request<Analysis>("/api/analyses", form);
}

async function request<T>(url: string, body: FormData): Promise<T> {
  const response = await fetch(url, { method: "POST", body });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as Problem | null;
    throw new Error(problem?.message ?? `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}
