import { useState } from "react";
import { ThumbsUp, MessageCircle, Eye, Heart, Lightbulb, Flag, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { getAnonymousAvatarEmoji } from "./anonymousAvatars";
import api from "../../services/api";

interface Discussion {
  id: number;
  category: string;
  title: string;
  content: string;
  author: { name: string; color: string };
  timestamp: string;
  views: number;
  replies: number;
  reactions: { likes: number; hearts: number; helpful: number };
  tags: string[];
  sentiment: string;
  isPoll: boolean;
  pollData?: {
    question: string;
    votes: number;
    options: { text: string; votes: number; percentage: number }[];
  };
  hasModeration: boolean;
  moderationNote?: string;
}

interface DiscussionCardProps {
  discussion: Discussion;
}

const sentimentStyles = {
  positive: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
  negative: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
  concerned: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20"
};

export function DiscussionCard({ discussion }: DiscussionCardProps) {
  const [reactions, setReactions] = useState(discussion.reactions);
  const react = async (reaction: "like" | "heart" | "helpful") => {
    const response = await api.post("/forum/reactions", {
      targetType: "post",
      targetId: discussion.id,
      reaction,
    });
    const key = reaction === "like" ? "likes" : reaction === "heart" ? "hearts" : "helpful";
    setReactions((current) => ({
      ...current,
      [key]: current[key] + (response.data.active ? 1 : -1),
    }));
  };

  const report = async () => {
    await api.post("/forum/reports", {
      targetType: "post",
      targetId: discussion.id,
      reason: "User report",
    });
  };

  return (
    <Link to={`/dashboard/forum/thread/${discussion.id}`}>
      <div className="group p-6 rounded-xl border border-border bg-card hover:bg-accent/20 hover:border-[var(--primary)]/50 transition-all hover:shadow-lg cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-md text-xl"
              style={{ backgroundColor: discussion.author.color }}
            >
              {getAnonymousAvatarEmoji(discussion.author.name)}
            </div>
            <div>
              <p className="text-sm text-foreground">{discussion.author.name}</p>
              <p className="text-xs text-muted-foreground">{discussion.timestamp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
              {discussion.category}
            </Badge>
            {discussion.hasModeration && (
              <Badge variant="warning" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {discussion.moderationNote}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-foreground mb-3 group-hover:text-[var(--primary)] transition-colors">
          {discussion.title}
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {discussion.content}
        </p>

        {/* Poll if exists */}
        {discussion.isPoll && discussion.pollData && (
          <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-[var(--primary)]/5 to-[var(--info)]/5 border border-[var(--primary)]/20">
            <p className="text-sm text-foreground mb-3">{discussion.pollData.question}</p>
            <div className="space-y-2">
              {discussion.pollData.options.map((option, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{option.text}</span>
                    <span className="text-xs text-foreground">{option.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--info)] transition-all"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{discussion.pollData.votes} votes</p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {discussion.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-md bg-[var(--accent)] text-xs text-muted-foreground hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <button type="button" onClick={(e) => { e.preventDefault(); react("like"); }} className="flex items-center gap-1.5 text-muted-foreground hover:text-[var(--primary)] transition-colors">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">{reactions.likes}</span>
            </button>
            <button type="button" onClick={(e) => { e.preventDefault(); react("heart"); }} className="flex items-center gap-1.5 text-muted-foreground hover:text-[var(--chart-3)] transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{reactions.hearts}</span>
            </button>
            <button type="button" onClick={(e) => { e.preventDefault(); react("helpful"); }} className="flex items-center gap-1.5 text-muted-foreground hover:text-[var(--warning)] transition-colors">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm">{reactions.helpful}</span>
            </button>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{discussion.replies} replies</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{discussion.views}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`text-xs ${sentimentStyles[discussion.sentiment as keyof typeof sentimentStyles]}`}
            >
              {discussion.sentiment}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                report();
              }}
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
