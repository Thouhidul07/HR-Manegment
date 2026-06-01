import { useEffect, useState } from "react";
import {
  MessageSquare, TrendingUp, Plus, Filter, Search, Users,
  ThumbsUp, MessageCircle, Eye, BarChart3, AlertTriangle,
  Heart, Smile, Flag, Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { TrendingTopics } from "../components/forum/TrendingTopics";
import { CreatePostModal } from "../components/forum/CreatePostModal";
import { DiscussionCard } from "../components/forum/DiscussionCard";
import { SentimentWidget } from "../components/forum/SentimentWidget";
import api from "../services/api";

const categories = [
  { id: "all", name: "All Topics", icon: MessageSquare, count: 342, color: "text-[var(--primary)]" },
  { id: "workplace", name: "Workplace Issues", icon: AlertTriangle, count: 89, color: "text-[var(--warning)]" },
  { id: "wellness", name: "Mental Wellness", icon: Heart, count: 124, color: "text-[var(--chart-3)]" },
  { id: "policies", name: "Company Policies", icon: Shield, count: 45, color: "text-[var(--info)]" },
  { id: "conflicts", name: "Team Conflicts", icon: Users, count: 32, color: "text-[var(--chart-4)]" },
  { id: "suggestions", name: "Suggestions", icon: Smile, count: 78, color: "text-[var(--success)]" },
  { id: "appreciation", name: "Appreciation", icon: ThumbsUp, count: 156, color: "text-[var(--chart-2)]" },
];

const discussions = [
  {
    id: 1,
    category: "Mental Wellness",
    title: "How do you manage work-life balance with remote work?",
    content: "I've been struggling to set boundaries between work and personal time since we went fully remote. My laptop is always nearby and I find myself checking emails late at night. Anyone else experiencing this?",
    author: { name: "Anonymous Panda", color: "#9A77CF" },
    timestamp: "2 hours ago",
    views: 234,
    replies: 18,
    reactions: { likes: 45, hearts: 12, helpful: 8 },
    tags: ["remote-work", "wellness", "boundaries"],
    sentiment: "concerned",
    isPoll: false,
    hasModeration: false
  },
  {
    id: 2,
    category: "Workplace Issues",
    title: "Concerns about the new performance review system",
    content: "The new quarterly review process feels overly complicated and time-consuming. It's taking away from actual work. I'm curious if others feel the same way or if I'm missing something about its benefits.",
    author: { name: "Anonymous Koala", color: "#EC4176" },
    timestamp: "5 hours ago",
    views: 567,
    replies: 42,
    reactions: { likes: 89, hearts: 5, helpful: 23 },
    tags: ["performance", "feedback", "process"],
    sentiment: "negative",
    isPoll: false,
    hasModeration: false
  },
  {
    id: 3,
    category: "Suggestions",
    title: "What if we had flexible Fridays?",
    content: "I'd like to propose a 'Flexible Friday' policy where employees can choose to work 4 longer days and take Friday off, or work normal hours all week. This could really help with work-life balance.",
    author: { name: "Anonymous Fox", color: "#FFA45E" },
    timestamp: "1 day ago",
    views: 891,
    replies: 67,
    reactions: { likes: 156, hearts: 34, helpful: 45 },
    tags: ["policy", "flexibility", "work-schedule"],
    sentiment: "positive",
    isPoll: true,
    pollData: {
      question: "Would you use a Flexible Friday option?",
      votes: 234,
      options: [
        { text: "Yes, definitely!", votes: 178, percentage: 76 },
        { text: "Maybe occasionally", votes: 42, percentage: 18 },
        { text: "No, prefer current schedule", votes: 14, percentage: 6 }
      ]
    },
    hasModeration: false
  },
  {
    id: 4,
    category: "Appreciation",
    title: "Shoutout to the IT team for the smooth system upgrade!",
    content: "Just wanted to say thank you to our IT department. The recent infrastructure upgrade went so smoothly - barely any downtime. Really appreciate the hard work that went into planning this!",
    author: { name: "Anonymous Owl", color: "#7C5FB5" },
    timestamp: "1 day ago",
    views: 445,
    replies: 28,
    reactions: { likes: 123, hearts: 89, helpful: 12 },
    tags: ["appreciation", "it-team", "infrastructure"],
    sentiment: "positive",
    isPoll: false,
    hasModeration: false
  },
  {
    id: 5,
    category: "Workplace Issues",
    title: "Meeting overload is affecting productivity",
    content: "I'm in back-to-back meetings 4-5 hours per day and it's impossible to get deep work done. By the time meetings end, I'm mentally exhausted. Anyone else dealing with this?",
    author: { name: "Anonymous Dolphin", color: "#543884" },
    timestamp: "2 days ago",
    views: 678,
    replies: 53,
    reactions: { likes: 134, hearts: 8, helpful: 34 },
    tags: ["meetings", "productivity", "time-management"],
    sentiment: "negative",
    isPoll: false,
    hasModeration: true,
    moderationNote: "Under review"
  },
  {
    id: 6,
    category: "Company Policies",
    title: "Can we get more clarity on the hybrid work policy?",
    content: "The current hybrid policy says '2-3 days in office' but it's not clear if that's per week, per month, or flexible. Different teams seem to interpret it differently. Could HR clarify?",
    author: { name: "Anonymous Bear", color: "#EC4176" },
    timestamp: "3 days ago",
    views: 523,
    replies: 31,
    reactions: { likes: 87, hearts: 4, helpful: 56 },
    tags: ["hybrid-work", "policy", "clarity"],
    sentiment: "neutral",
    isPoll: false,
    hasModeration: false
  }
];

export function Forum() {
  const [discussionList, setDiscussionList] = useState(discussions);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    let isMounted = true;

    api.get("/forum/posts", {
      params: {
        category: categories.find((category) => category.id === selectedCategory)?.name,
        search: searchQuery || undefined,
        sort: sortBy,
      },
    })
      .then((response) => {
        if (isMounted && response.data.posts?.length) {
          setDiscussionList(response.data.posts);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery, sortBy]);

  const filteredDiscussions = discussionList.filter(d =>
    (selectedCategory === "all" || d.category === categories.find(c => c.id === selectedCategory)?.name)
    && (!searchQuery || `${d.title} ${d.content}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreatePost = async (post: any) => {
    const response = await api.post("/forum/posts", post);
    setDiscussionList((currentDiscussions) => [response.data.post, ...currentDiscussions]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground mb-2">Anonymous Forum</h1>
          <p className="text-sm text-muted-foreground">
            Share your thoughts, concerns, and ideas anonymously in a safe space
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/forum/moderation">
            <Button variant="outline" className="gap-2">
              <Shield className="w-4 h-4" />
              Moderation
            </Button>
          </Link>
          <Button
            variant="primary"
            className="gap-2 bg-[var(--action)] hover:bg-[var(--action)]/90"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] text-white border-0 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-2xl mb-1">342</p>
          <p className="text-sm text-white/80">Active Discussions</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-2)]/20">
              <Users className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <Badge variant="success" className="text-xs">+18%</Badge>
          </div>
          <p className="text-2xl text-foreground mb-1">1,247</p>
          <p className="text-sm text-muted-foreground">Active Participants</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-3)]/20">
              <MessageCircle className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">3,456</p>
          <p className="text-sm text-muted-foreground">Total Replies</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--success)]/20">
              <BarChart3 className="w-5 h-5 text-[var(--success)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">87%</p>
          <p className="text-sm text-muted-foreground">Positive Sentiment</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filter Bar */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="discussed">Most Discussed</option>
                <option value="unanswered">Unanswered</option>
              </select>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </Card>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                      : 'bg-background border-border text-muted-foreground hover:border-[var(--primary)]/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{cat.name}</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${selectedCategory === cat.id ? 'bg-white/20 text-white' : ''}`}
                  >
                    {cat.count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Discussion Feed */}
          <div className="space-y-4">
            {filteredDiscussions.map((discussion) => (
              <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center">
            <Button variant="outline" className="gap-2">
              Load More Discussions
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sentiment Analytics */}
          <SentimentWidget />

          {/* Trending Topics */}
          <TrendingTopics />

          {/* Community Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--primary)]" />
                Community Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 text-[var(--primary)] text-sm">
                  1
                </div>
                <p className="text-sm text-muted-foreground">Be respectful and professional</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 text-[var(--primary)] text-sm">
                  2
                </div>
                <p className="text-sm text-muted-foreground">No harassment or hate speech</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 text-[var(--primary)] text-sm">
                  3
                </div>
                <p className="text-sm text-muted-foreground">Keep discussions constructive</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 text-[var(--primary)] text-sm">
                  4
                </div>
                <p className="text-sm text-muted-foreground">Report inappropriate content</p>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2 text-[var(--primary)]">
                Read Full Guidelines
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Week's Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Posts</span>
                <span className="text-sm text-foreground">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Replies</span>
                <span className="text-sm text-foreground">456</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="text-sm text-foreground">342</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolved Issues</span>
                <span className="text-sm text-foreground">23</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePost}
      />
    </div>
  );
}
