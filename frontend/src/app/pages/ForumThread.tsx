import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, ThumbsUp, Heart, Lightbulb, MessageCircle, Flag,
  Eye, Share2, Bookmark, MoreHorizontal, Send
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ReplyThread } from "../components/forum/ReplyThread";
import { getAnonymousAvatarEmoji } from "../components/forum/anonymousAvatars";
import api from "../services/api";

const threadData = {
  id: 1,
  category: "Mental Wellness",
  title: "How do you manage work-life balance with remote work?",
  content: "I've been struggling to set boundaries between work and personal time since we went fully remote. My laptop is always nearby and I find myself checking emails late at night. Anyone else experiencing this?\n\nI've tried setting specific work hours, but it's hard to stick to them when deadlines approach. Would love to hear what strategies have worked for others.",
  author: { name: "Anonymous Panda", color: "#9A77CF" },
  timestamp: "2 hours ago",
  views: 234,
  reactions: { likes: 45, hearts: 12, helpful: 8 },
  tags: ["remote-work", "wellness", "boundaries"],
  sentiment: "concerned",
  replies: [
    {
      id: 1,
      author: { name: "Anonymous Koala", color: "#EC4176" },
      content: "I completely relate to this. What helped me was creating a physical 'end of workday' ritual - I literally close my laptop and put it in a drawer. Out of sight, out of mind. Also set up email notifications to only come through during work hours.",
      timestamp: "1 hour ago",
      reactions: { likes: 23, hearts: 8, helpful: 15 },
      replies: [
        {
          id: 11,
          author: { name: "Anonymous Fox", color: "#FFA45E" },
          content: "The physical ritual is genius! I do something similar - I change out of 'work clothes' even though they're just casual clothes. It signals to my brain that work time is over.",
          timestamp: "45 minutes ago",
          reactions: { likes: 12, hearts: 5, helpful: 7 },
          replies: []
        },
        {
          id: 12,
          author: { name: "Anonymous Owl", color: "#7C5FB5" },
          content: "How do you handle it when there's a genuine emergency or urgent deadline? I struggle with the guilt of 'switching off'.",
          timestamp: "30 minutes ago",
          reactions: { likes: 8, hearts: 2, helpful: 4 },
          replies: [
            {
              id: 121,
              author: { name: "Anonymous Koala", color: "#EC4176" },
              content: "Good question! I distinguish between 'urgent' and 'important'. True emergencies are rare. For planned deadlines, I schedule extra work time in advance rather than letting it bleed into every evening. It's about being intentional.",
              timestamp: "20 minutes ago",
              reactions: { likes: 15, hearts: 6, helpful: 10 },
              replies: []
            }
          ]
        }
      ]
    },
    {
      id: 2,
      author: { name: "Anonymous Bear", color: "#543884" },
      content: "Have you tried using separate user accounts on your computer? I have a 'work' account and a 'personal' account. When I log out of work account, I can't access work apps/emails. It's been a game changer for me.",
      timestamp: "50 minutes ago",
      reactions: { likes: 18, hearts: 4, helpful: 12 },
      replies: []
    },
    {
      id: 3,
      author: { name: "Anonymous Dolphin", color: "#9A77CF" },
      content: "Something that really helped me was talking to my manager about it. They actually encouraged me to set better boundaries and even sent a team-wide message about not expecting responses outside work hours. Maybe worth bringing up?",
      timestamp: "35 minutes ago",
      reactions: { likes: 31, hearts: 15, helpful: 20 },
      replies: [
        {
          id: 31,
          author: { name: "Anonymous Tiger", color: "#EC4176" },
          content: "This is so important! Team culture makes a huge difference. If leadership models good boundaries, it gives everyone else permission to do the same.",
          timestamp: "15 minutes ago",
          reactions: { likes: 9, hearts: 4, helpful: 6 },
          replies: []
        }
      ]
    }
  ]
};

export function ForumThread() {
  const { threadId } = useParams();
  const [thread, setThread] = useState(threadData);
  const [replyContent, setReplyContent] = useState("");
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!threadId) return;

    let isMounted = true;
    api.get(`/forum/posts/${threadId}`)
      .then((response) => {
        if (isMounted && response.data.post) {
          setThread(response.data.post);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [threadId]);

  const toggleReaction = (type: string) => {
    setUserReactions(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;
    const response = await api.post(`/forum/posts/${thread.id}/replies`, {
      content: replyContent,
      isAnonymous: true,
    });
    setThread((currentThread) => ({
      ...currentThread,
      replies: [...currentThread.replies, response.data.reply],
    }));
    setReplyContent("");
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link to="/dashboard/forum">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </Button>
        </Link>
      </div>

      {/* Main Thread Card */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md text-2xl"
                style={{ backgroundColor: thread.author.color }}
              >
                {getAnonymousAvatarEmoji(thread.author.name)}
              </div>
              <div>
                <p className="text-foreground">{thread.author.name}</p>
                <p className="text-sm text-muted-foreground">{thread.timestamp}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                {thread.category}
              </Badge>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-foreground mb-4">{thread.title}</h1>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground whitespace-pre-line">
                {thread.content}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-[var(--accent)] text-sm text-muted-foreground hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{thread.views} views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span>{thread.replies.length} replies</span>
            </div>
          </div>

          {/* Reactions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                variant={userReactions.like ? "primary" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => toggleReaction('like')}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{thread.reactions.likes + (userReactions.like ? 1 : 0)}</span>
              </Button>
              <Button
                variant={userReactions.heart ? "primary" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => toggleReaction('heart')}
              >
                <Heart className="w-4 h-4" />
                <span>{thread.reactions.hearts + (userReactions.heart ? 1 : 0)}</span>
              </Button>
              <Button
                variant={userReactions.helpful ? "primary" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => toggleReaction('helpful')}
              >
                <Lightbulb className="w-4 h-4" />
                <span>{thread.reactions.helpful + (userReactions.helpful ? 1 : 0)}</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Bookmark className="w-4 h-4" />
                Save
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
                <Flag className="w-4 h-4" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Replies Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-foreground mb-6">
            {thread.replies.length} {thread.replies.length === 1 ? 'Reply' : 'Replies'}
          </h3>

          {/* Reply Input */}
          <div className="mb-6 p-4 rounded-xl border border-border bg-card">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--info)] flex items-center justify-center shadow-md text-xl">
                🙂
              </div>
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                className="gap-2 bg-[var(--action)] hover:bg-[var(--action)]/90"
                disabled={!replyContent.trim()}
                onClick={handlePostReply}
              >
                <Send className="w-4 h-4" />
                Post Reply
              </Button>
            </div>
          </div>

          {/* Replies Thread */}
          <div className="space-y-4">
            {thread.replies.map((reply) => (
              <ReplyThread key={reply.id} reply={reply} level={0} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
