"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Settings,
  X,
  Image as ImageIcon,
  Loader2,
  FileImage,
  ExternalLink,
  Save,
  KeyRound,
  RefreshCw
} from "lucide-react";
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  uploadMultipleToCloudinary,
  isImageFile,
  CloudinaryUploadResult,
  CloudinaryConfig
} from "@/lib/cloudinary";

interface CloudinaryUploaderProps {
  onUploadComplete: (results: CloudinaryUploadResult[]) => void;
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  description?: string;
  buttonText?: string;
}

export function CloudinaryUploader({
  onUploadComplete,
  folder = "cechstu_gallery",
  multiple = true,
  maxFiles = 30,
  className = "",
  label = "Upload Images to Cloudinary",
  description = "Drag and drop image files (JPG, PNG, HEIC/iPhone, WebP, SVG) or click to browse.",
  buttonText = "Bulk Upload Images"
}: CloudinaryUploaderProps) {
  const [config, setConfig] = useState<CloudinaryConfig>({
    cloudName: "",
    uploadPreset: "",
    isConfigured: false,
    source: "none"
  });
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [cloudNameInput, setCloudNameInput] = useState("");
  const [presetInput, setPresetInput] = useState("");
  const [configSavedToast, setConfigSavedToast] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, currentFile: "", percent: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshConfig = useCallback(() => {
    const current = getCloudinaryConfig();
    setConfig(current);
    setCloudNameInput(current.cloudName);
    setPresetInput(current.uploadPreset);
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudNameInput.trim() || !presetInput.trim()) {
      alert("Please enter both Cloud Name and Unsigned Upload Preset.");
      return;
    }

    saveCloudinaryConfig(cloudNameInput, presetInput);
    refreshConfig();
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
    setIsConfigModalOpen(false);
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const currentConfig = getCloudinaryConfig();
    if (!currentConfig.isConfigured) {
      setIsConfigModalOpen(true);
      return;
    }

    const filesArray = Array.from(fileList).filter(f => isImageFile(f));
    if (filesArray.length === 0) {
      setErrorMessage("No supported image files found. Please select JPG, PNG, HEIC, WEBP, or GIF files.");
      return;
    }

    const selectedFiles = multiple ? filesArray.slice(0, maxFiles) : [filesArray[0]];

    setErrorMessage(null);
    setSuccessCount(null);
    setIsUploading(true);
    setProgress({ done: 0, total: selectedFiles.length, currentFile: selectedFiles[0].name, percent: 0 });

    try {
      const { successful, failed } = await uploadMultipleToCloudinary(selectedFiles, {
        folder,
        onProgress: (p) => setProgress(p)
      });

      if (successful.length > 0) {
        onUploadComplete(successful.map(s => s.result));
        setSuccessCount(successful.length);
      }

      if (failed.length > 0) {
        setErrorMessage(
          `${failed.length} file(s) failed to upload: ${failed.map(f => `${f.file.name} (${f.error})`).join(", ")}`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.HEIC,.heif,.HEIF,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isUploading}
      />

      {/* Cloudinary Status & Config Pill */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs">
          {config.isConfigured ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Cloudinary Ready ({config.cloudName})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Cloudinary Not Configured
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsConfigModalOpen(true)}
          className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-slate-100"
          title="Configure Cloudinary API Credentials"
        >
          <Settings className="w-3 h-3" />
          Settings
        </button>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!config.isConfigured) {
            setIsConfigModalOpen(true);
          } else if (!isUploading) {
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
            : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
        } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
      >
        {isUploading ? (
          <div className="py-3 space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-600 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Uploading to Cloudinary... ({progress.done}/{progress.total})
              </p>
              <p className="text-[11px] text-slate-500 truncate max-w-xs mx-auto mt-0.5">
                {progress.currentFile}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-2">
            <div className="w-11 h-11 rounded-[16px] bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">{label}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-all">
                <FileImage className="w-3.5 h-3.5" />
                {buttonText}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successCount !== null && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Successfully uploaded {successCount} image(s) to Cloudinary!</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Cloudinary Settings Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-montserrat text-slate-900">
                    Cloudinary Credentials
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direct browser-to-Cloudinary image upload setup
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
                <p className="font-semibold text-slate-800">Free Setup in 2 Minutes:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-500">
                  <li>Log in to <span className="font-semibold text-blue-600">Cloudinary.com</span></li>
                  <li>Copy your <strong>Cloud Name</strong> from the Dashboard</li>
                  <li>Go to <strong>Settings &gt; Upload &gt; Upload presets</strong></li>
                  <li>Create an <strong>Unsigned preset</strong> (e.g. <code className="bg-slate-200 px-1 rounded">civil_club_uploads</code>)</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Cloud Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. dxk1abcde"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={cloudNameInput}
                  onChange={(e) => setCloudNameInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Unsigned Upload Preset <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. civil_club_uploads"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={presetInput}
                  onChange={(e) => setPresetInput(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
