import { useState } from "react";
import { X, MessageSquare, Hash, BarChart2, HelpCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { getAnonymousAvatarEmoji } from "./anonymousAvatars";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (post: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    isAnonymous: boolean;
    avatarAlias: string;
    avatarColor: string;
    pollData?: {
      question: string;
      votes: number;
      options: { text: string; votes: number; percentage: number }[];
    };
  }) => Promise<void> | void;
}

const categories = [
  "Workplace Issues",
  "Mental Wellness",
  "Company Policies",
  "Team Conflicts",
  "Suggestions",
  "Appreciation"
];

const anonymousAvatars = [
  { name: "Panda", color: "#9A77CF" },
  { name: "Koala", color: "#EC4176" },
  { name: "Fox", color: "#FFA45E" },
  { name: "Owl", color: "#7C5FB5" },
  { name: "Dolphin", color: "#543884" },
  { name: "Bear", color: "#9A77CF" },
  { name: "Tiger", color: "#EC4176" },
  { name: "Rabbit", color: "#7C5FB5" }
];

export function CreatePostModal({ isOpen, onClose, onCreate }: CreatePostModalProps) {
  const [postType, setPostType] = useState<'discussion' | 'poll'>('discussion');
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(anonymousAvatars[0]);
  const [pollOptions, setPollOptions] = useState(["", ""]);

  if (!isOpen) return null;

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async () => {
    await onCreate?.({
      category: selectedCategory,
      title,
      content: postType === 'discussion' ? content : title,
      tags,
      isAnonymous: true,
      avatarAlias: selectedAvatar.name,
      avatarColor: selectedAvatar.color,
      pollData: postType === 'poll' ? {
        question: title,
        votes: 0,
        options: pollOptions
          .filter(Boolean)
          .map((option) => ({ text: option, votes: 0, percentage: 0 })),
      } : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-[var(--primary)]/5 to-[var(--info)]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--info)] shadow-md">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-foreground">Create Anonymous Post</h2>
                <p className="text-sm text-muted-foreground">Share your thoughts safely</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Post Type */}
            <div>
              <label className="block text-sm text-foreground mb-3">Post Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPostType('discussion')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    postType === 'discussion'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-border hover:border-[var(--primary)]/50'
                  }`}
                >
                  <MessageSquare className={`w-5 h-5 mx-auto mb-2 ${
                    postType === 'discussion' ? 'text-[var(--primary)]' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm text-foreground">Discussion</p>
                </button>
                <button
                  onClick={() => setPostType('poll')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    postType === 'poll'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-border hover:border-[var(--primary)]/50'
                  }`}
                >
                  <BarChart2 className={`w-5 h-5 mx-auto mb-2 ${
                    postType === 'poll' ? 'text-[var(--primary)]' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm text-foreground">Poll</p>
                </button>
              </div>
            </div>

            {/* Anonymous Avatar Selection */}
            <div>
              <label className="block text-sm text-foreground mb-3">Your Anonymous Identity</label>
              <div className="grid grid-cols-4 gap-3">
                {anonymousAvatars.map((avatar) => (
                  <button
                    key={avatar.name}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedAvatar.name === avatar.name
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-border hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-xl shadow-md"
                      style={{ backgroundColor: avatar.color }}
                    >
                      {getAnonymousAvatarEmoji(avatar.name)}
                    </div>
                    <p className="text-xs text-center text-foreground">{avatar.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-foreground mb-2">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm text-foreground mb-2">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Content or Poll Options */}
            {postType === 'discussion' ? (
              <div>
                <label className="block text-sm text-foreground mb-2">
                  Content <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts in detail..."
                  rows={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-foreground mb-2">
                  Poll Options <span className="text-destructive">*</span>
                </label>
                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPollOption}
                  className="mt-2"
                >
                  Add Option
                </Button>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm text-foreground mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <Button onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex gap-3 p-4 rounded-lg bg-[var(--info)]/10 border border-[var(--info)]/20">
              <HelpCircle className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground mb-1">Anonymity Protection</p>
                <p className="text-sm text-muted-foreground">
                  Your identity is completely protected. Posts are reviewed by our AI moderation system to ensure a safe environment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-[var(--accent)]/30 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedCategory || !title || (postType === 'discussion' && !content)}
            className="bg-[var(--action)] hover:bg-[var(--action)]/90"
          >
            Post Anonymously
          </Button>
        </div>
      </div>
    </div>
  );
}
