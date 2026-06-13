import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  error = "",
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const closeDialog = () => {
    if (!loading) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={closeDialog} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Working..." : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">This action cannot be undone from this screen.</p>
          </div>
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
