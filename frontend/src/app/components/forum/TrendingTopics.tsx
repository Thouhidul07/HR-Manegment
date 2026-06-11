import { TrendingUp, Flame } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";

const trendingTopics = [
  {
    id: 1,
    title: "Flexible work arrangements",
    posts: 45,
    trend: "+23%",
    sentiment: "positive"
  },
  {
    id: 2,
    title: "Meeting culture improvements",
    posts: 38,
    trend: "+156%",
    sentiment: "mixed"
  },
  {
    id: 3,
    title: "Mental health resources",
    posts: 34,
    trend: "+12%",
    sentiment: "positive"
  },
  {
    id: 4,
    title: "Team collaboration tools",
    posts: 29,
    trend: "+8%",
    sentiment: "neutral"
  },
  {
    id: 5,
    title: "Office space concerns",
    posts: 27,
    trend: "+45%",
    sentiment: "negative"
  }
];

export function TrendingTopics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[var(--chart-4)]" />
          Trending Topics
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Hot discussions this week</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <div
            key={topic.id}
            className="p-3 rounded-lg hover:bg-[var(--accent)] transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0
                ${index === 0 ? 'bg-[var(--chart-4)] text-white' :
                  index === 1 ? 'bg-[var(--chart-2)]/20 text-[var(--chart-2)]' :
                  'bg-[var(--accent)] text-muted-foreground'}
              `}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground mb-1 group-hover:text-[var(--primary)] transition-colors truncate">
                  {topic.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{topic.posts} posts</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[var(--success)]" />
                    <span className="text-xs text-[var(--success)]">{topic.trend}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
