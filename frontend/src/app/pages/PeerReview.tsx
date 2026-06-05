import { useEffect, useState } from "react";
import { Star, Search, Download, Calendar, Briefcase, Clock, TrendingUp, Award, AlertCircle, Filter, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import api from "../services/api";

interface PeerReview {
  id: string;
  employeeAvatar: string;
  employeeName: string;
  employeeRole: string;
  employeeDepartment: string;
  project: string;
  duration: string;
  rating: number;
  review: string;
  reviewDate: string;
  reviewCount: number;
  strengths: string[];
  improvements: string[];
  categories: {
    communication: number;
    technical: number;
    teamwork: number;
    leadership: number;
  };
}

const mockReviews: PeerReview[] = [
  {
    id: "1",
    employeeAvatar: "SA",
    employeeName: "Sadia Rahman",
    employeeRole: "Software Engineer",
    employeeDepartment: "Information Technology",
    project: "Employee Portal Enhancement",
    duration: "6 months",
    rating: 5,
    review: "Sadia consistently demonstrates exceptional technical skills and leadership. She mentored junior developers effectively and delivered high-quality code on time. Her attention to detail and proactive communication made the project smoother for everyone.",
    reviewDate: "2026-05-15",
    reviewCount: 4,
    strengths: ["Strong technical expertise", "Great mentor", "Excellent communicator"],
    improvements: ["Could delegate more tasks"],
    categories: {
      communication: 5,
      technical: 5,
      teamwork: 4,
      leadership: 5
    }
  },
  {
    id: "2",
    employeeAvatar: "MK",
    employeeName: "Mahmudul Karim",
    employeeRole: "Operations Executive",
    employeeDepartment: "Operations",
    project: "HR Service Desk Rollout",
    duration: "4 months",
    rating: 4,
    review: "Mahmudul did a great job keeping the team aligned and prioritizing features effectively. He was responsive to feedback and maintained clear documentation throughout. Sometimes decisions took longer than needed, but the outcomes were always well thought out.",
    reviewDate: "2026-05-10",
    reviewCount: 3,
    strengths: ["Clear vision", "Good stakeholder management", "Detail-oriented"],
    improvements: ["Faster decision-making", "More technical depth"],
    categories: {
      communication: 5,
      technical: 3,
      teamwork: 4,
      leadership: 4
    }
  },
  {
    id: "3",
    employeeAvatar: "JF",
    employeeName: "Jannatul Ferdous",
    employeeRole: "Software Engineer",
    employeeDepartment: "Information Technology",
    project: "Data Pipeline Migration",
    duration: "3 months",
    rating: 5,
    review: "Jannatul's work on the migration was outstanding. She identified potential issues early, created comprehensive documentation, and ensured zero downtime during the transition. Her collaboration with the DevOps team was exemplary.",
    reviewDate: "2026-05-08",
    reviewCount: 5,
    strengths: ["Proactive problem-solving", "Excellent documentation", "Strong collaboration"],
    improvements: ["Share knowledge more frequently"],
    categories: {
      communication: 4,
      technical: 5,
      teamwork: 5,
      leadership: 4
    }
  },
  {
    id: "4",
    employeeAvatar: "RA",
    employeeName: "Rafi Ahmed",
    employeeRole: "Marketing Executive",
    employeeDepartment: "Marketing",
    project: "Marketing Campaign Analytics",
    duration: "2 months",
    rating: 3,
    review: "Rafi provided useful insights from the data, though sometimes the analysis could have been more in-depth. He was collaborative and open to feedback. With more experience, his analytical skills will continue to improve.",
    reviewDate: "2026-05-05",
    reviewCount: 2,
    strengths: ["Good team player", "Quick learner", "Positive attitude"],
    improvements: ["Deeper analysis", "More initiative", "Better time management"],
    categories: {
      communication: 4,
      technical: 3,
      teamwork: 4,
      leadership: 2
    }
  },
  {
    id: "5",
    employeeAvatar: "TN",
    employeeName: "Tasmia Noor",
    employeeRole: "Software Engineer",
    employeeDepartment: "Information Technology",
    project: "Security Audit 2026",
    duration: "5 months",
    rating: 5,
    review: "Tasmia's thoroughness in the security audit was impressive. She identified critical vulnerabilities and provided actionable remediation plans. Her ability to explain complex security concepts to non-technical stakeholders was invaluable.",
    reviewDate: "2026-04-28",
    reviewCount: 6,
    strengths: ["Deep technical knowledge", "Clear communicator", "Thorough and meticulous"],
    improvements: [],
    categories: {
      communication: 5,
      technical: 5,
      teamwork: 5,
      leadership: 5
    }
  },
  {
    id: "6",
    employeeAvatar: "MH",
    employeeName: "Mehedi Hasan",
    employeeRole: "Junior Software Engineer",
    employeeDepartment: "Information Technology",
    project: "HR Portal Enhancement",
    duration: "3 months",
    rating: 4,
    review: "Mehedi delivered a clean, user-friendly interface with great attention to accessibility. He was responsive to feedback and collaborated well with the IT team. Some components could have been more reusable, but overall solid work.",
    reviewDate: "2026-04-22",
    reviewCount: 3,
    strengths: ["Strong UI/UX skills", "Accessibility-focused", "Great collaboration"],
    improvements: ["More code reusability", "Better testing coverage"],
    categories: {
      communication: 4,
      technical: 4,
      teamwork: 5,
      leadership: 3
    }
  },
  {
    id: "7",
    employeeAvatar: "AH",
    employeeName: "Arif Hossain",
    employeeRole: "Software Engineer",
    employeeDepartment: "Information Technology",
    project: "Infrastructure Modernization",
    duration: "8 months",
    rating: 5,
    review: "Arif led the infrastructure modernization with expertise and precision. The migration to containerized services was seamless, and the new CI/CD pipeline significantly improved our deployment speed. Excellent technical leadership and team collaboration.",
    reviewDate: "2026-05-20",
    reviewCount: 4,
    strengths: ["Infrastructure expertise", "Strategic thinking", "Strong leadership"],
    improvements: ["Documentation could be more detailed"],
    categories: {
      communication: 4,
      technical: 5,
      teamwork: 5,
      leadership: 5
    }
  },
  {
    id: "8",
    employeeAvatar: "SS",
    employeeName: "Sharmin Sultana",
    employeeRole: "Support Executive",
    employeeDepartment: "Customer Support",
    project: "Support Workflow Improvement",
    duration: "4 months",
    rating: 5,
    review: "Sharmin created a comprehensive support workflow that improved employee service quality. Her documentation was thorough, and she collaborated effectively with HR and IT teams. The documentation is exemplary.",
    reviewDate: "2026-05-18",
    reviewCount: 5,
    strengths: ["User-centered approach", "Excellent documentation", "Cross-functional collaboration"],
    improvements: [],
    categories: {
      communication: 5,
      technical: 4,
      teamwork: 5,
      leadership: 4
    }
  }
];

export function PeerReview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<PeerReview | null>(null);
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    api.get("/peer-reviews/analytics")
      .then((response) => {
        if (isMounted) {
          setReviews(response.data.reviews || []);
          setReviewsError("");
        }
      })
      .catch(() => {
        if (isMounted) {
          setReviews([]);
          setReviewsError("Unable to load peer review analytics.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingReviews(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const departments = Array.from(new Set(reviews.map(r => r.employeeDepartment)));

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      review.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.employeeRole.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = filterRating === null || review.rating === filterRating;
    const matchesDepartment = filterDepartment === null || review.employeeDepartment === filterDepartment;

    return matchesSearch && matchesRating && matchesDepartment;
  });

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
  const totalReviews = reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: totalReviews ? (reviews.filter(r => r.rating === star).length / totalReviews) * 100 : 0
  }));

  const handleExportReport = () => {
    const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `peer-review-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Peer Review Analytics</h1>
          <p className="text-muted-foreground">Employee feedback and performance insights across all teams</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExportReport}>
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#543884]/10">
              <Star className="w-5 h-5 text-[#543884]" />
            </div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{avgRating} / 5.0</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#9A77CF]/10">
              <Users className="w-5 h-5 text-[#9A77CF]" />
            </div>
            <p className="text-sm text-muted-foreground">Employees Reviewed</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{new Set(reviews.map((review) => review.employeeName)).size}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#EC4176]/10">
              <Award className="w-5 h-5 text-[#EC4176]" />
            </div>
            <p className="text-sm text-muted-foreground">Total Reviews</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{reviews.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#FFA45E]/10">
              <TrendingUp className="w-5 h-5 text-[#FFA45E]" />
            </div>
            <p className="text-sm text-muted-foreground">5-Star Reviews</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{ratingDistribution[0].count}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Reviews List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#9A77CF] text-sm"
                />
              </div>

              {/* Rating Filter */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Filter by Rating</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilterRating(null)}
                    className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      filterRating === null
                        ? 'bg-[#543884] text-white'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    All Ratings
                  </button>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(rating)}
                      className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                        filterRating === rating
                          ? 'bg-[#543884] text-white'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs">({ratingDistribution[5 - rating].count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-3">Rating Distribution</p>
                <div className="space-y-2">
                  {ratingDistribution.map(({ star, count, percentage }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">{star} ★</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FFA45E] rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Filter */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-2">Filter by Department</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilterDepartment(null)}
                    className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      filterDepartment === null
                        ? 'bg-[#543884] text-white'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    All Departments
                  </button>
                  {departments.map(dept => (
                    <button
                      key={dept}
                      onClick={() => setFilterDepartment(dept)}
                      className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        filterDepartment === dept
                          ? 'bg-[#543884] text-white'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Review Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Employee Reviews ({filteredReviews.length})</CardTitle>
                <p className="text-xs text-muted-foreground">Click to expand details</p>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReviews ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading peer review analytics...</p>
                </div>
              ) : reviewsError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{reviewsError}</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No reviews found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedReview?.id === review.id
                          ? 'border-[#543884] bg-[#543884]/5'
                          : 'border-border hover:border-[#9A77CF]/50 bg-card'
                      }`}
                      onClick={() => setSelectedReview(selectedReview?.id === review.id ? null : review)}
                    >
                      {/* Review Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                          {review.employeeAvatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">{review.employeeName}</h3>
                              <p className="text-sm text-muted-foreground">{review.employeeRole}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < review.rating
                                        ? 'fill-[#FFA45E] text-[#FFA45E]'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">{review.reviewCount} reviews</span>
                            </div>
                          </div>

                          {/* Project & Duration */}
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <Badge variant="secondary" size="sm">{review.employeeDepartment}</Badge>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>{review.project}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{review.duration}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(review.reviewDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="mb-4 p-4 bg-secondary/50 rounded-lg border-l-4 border-[#543884]">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Anonymous Peer Feedback:</p>
                        <p className="text-sm text-foreground leading-relaxed italic">"{review.review}"</p>
                      </div>

                      {/* Expandable Details */}
                      {selectedReview?.id === review.id && (
                        <div className="pt-4 border-t border-border space-y-4 animate-in fade-in duration-200">
                          {/* Category Ratings */}
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">Category Breakdown</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(review.categories).map(([category, rating]) => (
                                <div key={category} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground capitalize">{category}</span>
                                    <span className="text-xs font-medium text-foreground">{rating}/5</span>
                                  </div>
                                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#543884] to-[#9A77CF] rounded-full"
                                      style={{ width: `${(rating / 5) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Strengths */}
                          {review.strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">Strengths</h4>
                              <div className="flex flex-wrap gap-2">
                                {review.strengths.map((strength, idx) => (
                                  <Badge key={idx} variant="success" size="sm">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Areas for Improvement */}
                          {review.improvements.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">Areas for Improvement</h4>
                              <div className="flex flex-wrap gap-2">
                                {review.improvements.map((improvement, idx) => (
                                  <Badge key={idx} variant="warning" size="sm">
                                    {improvement}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
