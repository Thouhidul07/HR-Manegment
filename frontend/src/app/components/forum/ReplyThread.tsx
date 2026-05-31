import { useState } from "react";
import { ThumbsUp, Heart, Lightbulb, MessageCircle, Flag, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/Button";

interface Reply {
  id: number;
  author: { name: string; color: string };
  content: string;
  timestamp: string;
  reactions: { likes: number; hearts: number; helpful: number };
  replies: Reply[];
}

interface ReplyThreadProps {
  reply: Reply;
  level: number;
}

const identityLogos: Record<string, string> = {
  Panda: "🐼",
  Koala: "🐨",
  Fox: "🦊",
  Owl: "🦉",
  Dolphin: "🐬",
  Bear: "🐻",
  Tiger: "🐯",
  Rabbit: "🐰",
};

export function ReplyThread({ reply, level }: ReplyThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [activeReaction, setActiveReaction] = useState<"like" | "heart" | "helpful" | null>(null);
  const [isReported, setIsReported] = useState(false);
  const [replySubmitted, setReplySubmitted] = useState(false);
  const identityName = reply.author.name.replace("Anonymous ", "");
  const identityLogo = identityLogos[identityName] ?? "💬";

  const toggleReaction = (type: "like" | "heart" | "helpful") => {
    setActiveReaction((current) => (current === type ? null : type));
  };

  const maxNestingLevel = 3;
  const canNest = level < maxNestingLevel;
  const handleSubmitReply = () => {
    if (!replyContent.trim()) return;
    setReplySubmitted(true);
    setReplyContent("");
    window.setTimeout(() => {
      setReplySubmitted(false);
      setShowReplyForm(false);
    }, 1400);
  };

  return (
    <div className={level > 0 ? "ml-12 mt-4" : ""}>
      <div
        className="p-4 rounded-xl border border-border bg-card hover:border-[var(--primary)]/30 transition-all"
        style={{
          background: `linear-gradient(135deg, ${reply.author.color}14 0%, var(--card) 36%, var(--accent) 100%)`,
        }}
      >
        {/* Reply Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-md text-xl ring-2 ring-white/10"
              style={{
                backgroundColor: `${reply.author.color}26`,
                border: `1px solid ${reply.author.color}`,
              }}
              aria-hidden="true"
            >
              {identityLogo}
            </div>
            <div>
              <p className="text-sm text-foreground">{reply.author.name}</p>
              <p className="text-xs text-muted-foreground">{reply.timestamp}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Reply Content */}
        <p className="text-sm text-muted-foreground mb-4 ml-12">
          {reply.content}
        </p>

        {/* Reply Actions */}
        <div className="flex items-center justify-between ml-12">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${activeReaction === "like" ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'}`}
              onClick={() => toggleReaction('like')}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="text-xs">{reply.reactions.likes + (activeReaction === "like" ? 1 : 0)}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${activeReaction === "heart" ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
              onClick={() => toggleReaction('heart')}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="text-xs">{reply.reactions.hearts + (activeReaction === "heart" ? 1 : 0)}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${activeReaction === "helpful" ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
              onClick={() => toggleReaction('helpful')}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="text-xs">{reply.reactions.helpful + (activeReaction === "helpful" ? 1 : 0)}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {canNest && (
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
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${isReported ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
              onClick={() => setIsReported((current) => !current)}
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="text-xs">{isReported ? "Reported" : "Report"}</span>
            </Button>
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && canNest && (
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
                onClick={handleSubmitReply}
              >
                {replySubmitted ? "Reply posted" : "Reply"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2">
          {reply.replies.map((nestedReply) => (
            <ReplyThread key={nestedReply.id} reply={nestedReply} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
