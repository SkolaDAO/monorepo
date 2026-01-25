import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@skola/ui";

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.secure_url;
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        setError("Image upload not configured. Please use URL instead.");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const url = await uploadToCloudinary(file);
        onChange(url);
      } catch {
        setError("Failed to upload image. Try again or use URL.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: disabled || isUploading,
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setError(null);
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
          <img
            src={value}
            alt="Course cover"
            className="h-full w-full object-cover"
            onError={() => setError("Failed to load image")}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="secondary" size="sm" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <UploadIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          {isUploading ? (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-sm text-primary">Drop image here</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Drag & drop an image, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF, WebP up to 5MB
              </p>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or paste URL</span>
        </div>
      </div>

      <input
        type="url"
        placeholder="https://example.com/image.jpg"
        onChange={handleUrlChange}
        disabled={disabled || isUploading}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
