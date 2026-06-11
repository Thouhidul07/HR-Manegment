import { Smile, Meh, Frown, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";

export function SentimentWidget() {
  const sentimentData = [
    { label: "Positive", value: 65, color: "bg-[var(--success)]", icon: Smile },
    { label: "Neutral", value: 23, color: "bg-[var(--info)]", icon: Meh },
    { label: "Negative", value: 12, color: "bg-destructive", icon: Frown }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
          Sentiment Overview
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Overall forum mood</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment Breakdown */}
        {sentimentData.map((sentiment) => {
          const Icon = sentiment.icon;
          return (
            <div key={sentiment.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{sentiment.label}</span>
                </div>
                <span className="text-sm text-foreground">{sentiment.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full ${sentiment.color} transition-all`}
                  style={{ width: `${sentiment.value}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Overall Score */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-[var(--success)]/10 to-[var(--success)]/5 border border-[var(--success)]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Health Score</p>
              <p className="text-2xl text-foreground">87/100</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--success)]/20">
              <Smile className="w-6 h-6 text-[var(--success)]" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Community sentiment is healthy this week
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
