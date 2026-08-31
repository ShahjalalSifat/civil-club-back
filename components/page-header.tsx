import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageHeader({ title, description, actionLabel, onAction }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-montserrat text-slate-900 tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <div className="flex-none">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all min-h-[44px] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
