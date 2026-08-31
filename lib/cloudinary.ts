export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  isConfigured: boolean;
  source: "env" | "storage" | "none";
}

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
  originalFilename?: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const envCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const envUploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (envCloudName && envUploadPreset) {
    return {
      cloudName: envCloudName,
      uploadPreset: envUploadPreset,
      isConfigured: true,
      source: "env",
    };
  }

  if (typeof window !== "undefined") {
    const storedCloudName = localStorage.getItem("cechstu_cloudinary_cloud_name")?.trim();
    const storedUploadPreset = localStorage.getItem("cechstu_cloudinary_upload_preset")?.trim();

    if (storedCloudName && storedUploadPreset) {
      return {
        cloudName: storedCloudName,
        uploadPreset: storedUploadPreset,
        isConfigured: true,
        source: "storage",
      };
    }
  }

  return {
    cloudName: "",
    uploadPreset: "",
    isConfigured: false,
    source: "none",
  };
}

export function saveCloudinaryConfig(cloudName: string, uploadPreset: string) {
  if (typeof window !== "undefined") {
    if (cloudName.trim() && uploadPreset.trim()) {
      localStorage.setItem("cechstu_cloudinary_cloud_name", cloudName.trim());
      localStorage.setItem("cechstu_cloudinary_upload_preset", uploadPreset.trim());
    } else {
      localStorage.removeItem("cechstu_cloudinary_cloud_name");
      localStorage.removeItem("cechstu_cloudinary_upload_preset");
    }
  }
}

export function validateImageFile(file: File, maxMb: number = 10): { valid: boolean; error?: string } {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: `${file.name} is not a valid image file.` };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `${file.name} exceeds maximum file size (${maxMb}MB).` };
  }

  return { valid: true };
}

export async function uploadSingleToCloudinary(
  file: File,
  folder: string = "cechstu_gallery"
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME & NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, or configure them in Cloudinary Settings."
    );
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      `Upload failed with HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();

  return {
    url: data.url || data.secure_url,
    secureUrl: data.secure_url || data.url,
    publicId: data.public_id,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
    originalFilename: file.name,
  };
}

export async function uploadMultipleToCloudinary(
  files: File[],
  options?: {
    folder?: string;
    onProgress?: (progress: { done: number; total: number; currentFile: string; percent: number }) => void;
  }
): Promise<{
  successful: { file: File; result: CloudinaryUploadResult }[];
  failed: { file: File; error: string }[];
}> {
  const successful: { file: File; result: CloudinaryUploadResult }[] = [];
  const failed: { file: File; error: string }[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (options?.onProgress) {
      options.onProgress({
        done: i,
        total,
        currentFile: file.name,
        percent: Math.round((i / total) * 100),
      });
    }

    try {
      const result = await uploadSingleToCloudinary(file, options?.folder);
      successful.push({ file, result });
    } catch (err: any) {
      failed.push({ file, error: err.message || "Failed to upload" });
    }

    if (options?.onProgress) {
      options.onProgress({
        done: i + 1,
        total,
        currentFile: file.name,
        percent: Math.round(((i + 1) / total) * 100),
      });
    }
  }

  return { successful, failed };
}
