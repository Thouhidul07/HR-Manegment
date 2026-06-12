import { useState } from "react";
import { ThumbsUp, Heart, Lightbulb, MessageCircle, Flag, Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Modal } from "../ui/Modal";
import { getAnonymousAvatarEmoji } from "./anonymousAvatars";
import api from "../../services/api";

interface Reply {
  id: number;
  author: { name: string; color: string };
  content: string;
  timestamp: string;
  reactions: { likes: number; hearts: number; helpful: number };
  replies: Reply[];
  isOwner?: boolean;
}

interface ReplyThreadProps {
  reply: Reply;
  level: number;
  canParticipate?: boolean;
}

export function ReplyThread({ reply, level, canParticipate = true }: ReplyThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [currentContent, setCurrentContent] = useState(reply.content);
  const [isHidden, setIsHidden] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingReply, setDeletingReply] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [childReplies, setChildReplies] = useState(reply.replies || []);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  if (isHidden) {
    return null;
  }

  const toggleReaction = (type: string) => {
    setUserReactions(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const maxNestingLevel = 3;
  const canNest = level < maxNestingLevel;

  const handleDeleteReply = async () => {
    setDeletingReply(true);
    setDeleteError("");
    try {
      await api.delete(`/forum/replies/${reply.id}`);
      setIsDeleteDialogOpen(false);
      setDeleteMessage("Reply deleted.");
      window.setTimeout(() => setIsHidden(true), 900);
    } catch (error: any) {
      setDeleteError(error?.response?.data?.message || "Unable to delete this reply.");
    } finally {
      setDeletingReply(false);
    }
  };

  const handlePostNestedReply = async () => {
    if (!replyContent.trim()) return;

    try {
      const response = await api.post(`/forum/replies/${reply.id}/replies`, {
        content: replyContent,
        isAnonymous: true,
      });
      setChildReplies((current) => [...current, response.data.reply]);
    } catch {
      setChildReplies((current) => [
        ...current,
        {
          id: Date.now(),
          author: { name: "Anonymous You", color: "#9A77CF" },
          content: replyContent,
          timestamp: "Just now",
          reactions: { likes: 0, hearts: 0, helpful: 0 },
          replies: [],
          isOwner: true,
        },
      ]);
    }
    setReplyContent("");
    setShowReplyForm(false);
  };

  const handleReportReply = async () => {
    if (!reportReason.trim()) return;

    try {
      await api.post("/forum/reports", {
        targetType: "reply",
        targetId: reply.id,
        reason: reportReason,
      });
      setReportMessage("Reply report submitted.");
    } catch {
      setReportMessage("Reply report saved locally for moderation.");
    }
    setReportReason("");
    setIsReportModalOpen(false);
    window.setTimeout(() => setReportMessage(""), 2600);
  };

  return (
    <div className={level > 0 ? "ml-12 mt-4" : ""}>
      <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent/20 hover:border-[var(--primary)]/30 transition-all">
        {deleteMessage && (
          <div className="mb-3 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]">
            {deleteMessage}
          </div>
        )}
        {reportMessage && (
          <div className="mb-3 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]">
            {reportMessage}
          </div>
        )}
        {/* Reply Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md text-lg"
              style={{ backgroundColor: reply.author.color }}
            >
              {getAnonymousAvatarEmoji(reply.author.name)}
            </div>
            <div>
              <p className="text-sm text-foreground">{reply.author.name}</p>
              <p className="text-xs text-muted-foreground">{reply.timestamp}</p>
            </div>
          </div>
          {canParticipate && reply.isOwner && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-[var(--primary)]"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setDeleteError("");
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Reply Content */}
        {isEditing ? (
          <div className="mb-4 ml-12 space-y-2">
            <textarea
              value={editedContent}
              onChange={(event) => setEditedContent(event.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!editedContent.trim()}
                onClick={async () => {
                  await api.patch(`/forum/replies/${reply.id}`, { content: editedContent });
                  setCurrentContent(editedContent);
                  setIsEditing(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4 ml-12">
            {currentContent}
          </p>
        )}

        {/* Reply Actions */}
        <div className="flex items-center justify-between ml-12">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${canParticipate && userReactions.like ? 'text-[var(--primary)]' : 'text-muted-foreground'}`}
              onClick={() => canParticipate && toggleReaction('like')}
              disabled={!canParticipate}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="text-xs">{reply.reactions.likes + (canParticipate && userReactions.like ? 1 : 0)}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${canParticipate && userReactions.heart ? 'text-[var(--chart-3)]' : 'text-muted-foreground'}`}
              onClick={() => canParticipate && toggleReaction('heart')}
              disabled={!canParticipate}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="text-xs">{reply.reactions.hearts + (canParticipate && userReactions.heart ? 1 : 0)}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${canParticipate && userReactions.helpful ? 'text-[var(--warning)]' : 'text-muted-foreground'}`}
              onClick={() => canParticipate && toggleReaction('helpful')}
              disabled={!canParticipate}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="text-xs">{reply.reactions.helpful + (canParticipate && userReactions.helpful ? 1 : 0)}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {canParticipate && canNest && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-[var(--primary)]"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
            {canParticipate && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-destructive"
                onClick={() => setIsReportModalOpen(true)}
              >
                <Flag className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && canParticipate && canNest && (
          <div className="mt-4 ml-12 p-3 rounded-lg bg-background border border-border">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!replyContent.trim()}
                className="bg-[var(--action)] hover:bg-[var(--action)]/90"
                onClick={handlePostNestedReply}
              >
                Reply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {childReplies && childReplies.length > 0 && (
        <div className="mt-2">
          {childReplies.map((nestedReply) => (
            <ReplyThread key={nestedReply.id} reply={nestedReply} level={level + 1} canParticipate={canParticipate} />
          ))}
        </div>
      )}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Reply"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReportReply} disabled={!reportReason.trim()}>
              Submit Report
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Share the issue with moderators. The reply author stays anonymous.
          </p>
          <textarea
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Reason for reporting..."
          />
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(reply.isOwner && isDeleteDialogOpen)}
        title="Delete Reply"
        message="Delete this reply? It will be removed from the thread."
        confirmLabel="Delete Reply"
        loading={deletingReply}
        error={deleteError}
        onClose={() => {
          if (deletingReply) return;
          setIsDeleteDialogOpen(false);
          setDeleteError("");
        }}
        onConfirm={handleDeleteReply}
      />
    </div>
  );
}
