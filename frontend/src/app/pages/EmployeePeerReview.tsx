import { useEffect, useState } from "react";
import { Star, Plus, Send, User, Briefcase, Clock, Calendar, Award, TrendingUp, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { motion } from "motion/react";
import api from "../services/api";

interface ReceivedReview {
  id: string;
  project: string;
  duration: string;
  rating: number;
  review: string;
  reviewDate: string;
  strengths: string[];
  improvements: string[];
  categories: {
    communication: number;
    technical: number;
    teamwork: number;
    leadership: number;
  };
}

interface Teammate {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
}

const mockReceivedReviews: ReceivedReview[] = [
  {
    id: "1",
    project: "Mobile App Redesign",
    duration: "6 months",
    rating: 5,
    review: "Excellent collaboration throughout the project. Your technical expertise and willingness to help others really stood out. The code reviews were thorough and constructive. Keep up the great work!",
    reviewDate: "2026-05-15",
    strengths: ["Strong technical skills", "Great team player", "Always willing to help"],
    improvements: ["Could share knowledge more in team meetings"],
    categories: {
      communication: 4,
      technical: 5,
      teamwork: 5,
      leadership: 4
    }
  },
  {
    id: "2",
    project: "Customer Portal V2",
    duration: "4 months",
    rating: 4,
    review: "Good work on the frontend components. Your attention to detail in the UI implementation was impressive. Sometimes communication could be more proactive, but overall a solid contribution to the team.",
    reviewDate: "2026-05-10",
    strengths: ["Detail-oriented", "Clean code", "Good problem solver"],
    improvements: ["More proactive communication", "Take more initiative"],
    categories: {
      communication: 3,
      technical: 4,
      teamwork: 4,
      leadership: 3
    }
  },
  {
    id: "3",
    project: "Data Pipeline Migration",
    duration: "3 months",
    rating: 5,
    review: "Outstanding work! You identified critical issues early and proposed excellent solutions. Your documentation was comprehensive and made onboarding new team members much easier. Truly appreciate your contribution.",
    reviewDate: "2026-04-28",
    strengths: ["Proactive problem-solving", "Excellent documentation", "Mentorship"],
    improvements: [],
    categories: {
      communication: 5,
      technical: 5,
      teamwork: 5,
      leadership: 5
    }
  }
];

const mockTeammates: Teammate[] = [
  { id: "1", name: "Sadia Rahman", avatar: "SR", role: "Senior Developer", department: "Information Technology" },
  { id: "2", name: "Mahmudul Karim", avatar: "MK", role: "Product Manager", department: "Product" },
  { id: "3", name: "Jannatul Ferdous", avatar: "JF", role: "Data Engineer", department: "Information Technology" },
  { id: "4", name: "Rafi Ahmed", avatar: "RA", role: "Marketing Analyst", department: "Marketing" },
  { id: "5", name: "Tasmia Noor", avatar: "TN", role: "Security Engineer", department: "Information Technology" },
];

export function EmployeePeerReview() {
  const [activeTab, setActiveTab] = useState<'received' | 'submit'>('received');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedTeammate, setSelectedTeammate] = useState<Teammate | null>(null);
  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[]>(mockReceivedReviews);
  const [teammates, setTeammates] = useState<Teammate[]>(mockTeammates);
  const [givenCount, setGivenCount] = useState(5);
  const [formData, setFormData] = useState({
    project: '',
    duration: '',
    review: '',
    communication: 0,
    technical: 0,
    teamwork: 0,
    leadership: 0,
    strengths: '',
    improvements: ''
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.get("/peer-reviews/mine"),
      api.get("/peer-reviews/teammates"),
    ])
      .then(([mineResponse, teammatesResponse]) => {
        if (!isMounted) return;

        if (mineResponse.data.reviews?.length) {
          setReceivedReviews(mineResponse.data.reviews);
        }

        setGivenCount(Number(mineResponse.data.givenCount || 0));

        if (teammatesResponse.data.teammates?.length) {
          setTeammates(teammatesResponse.data.teammates);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const avgRating = receivedReviews.length
    ? (receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length).toFixed(1)
    : "0.0";
  const totalReviews = receivedReviews.length;

  const handleSubmitReview = async () => {
    if (!selectedTeammate) {
      return;
    }

    await api.post("/peer-reviews", {
      revieweeId: selectedTeammate.id,
      project: formData.project,
      duration: formData.duration,
      review: formData.review,
      communication: formData.communication,
      technical: formData.technical,
      teamwork: formData.teamwork,
      leadership: formData.leadership,
      strengths: formData.strengths,
      improvements: formData.improvements,
    });

    setFormData({
      project: '',
      duration: '',
      review: '',
      communication: 0,
      technical: 0,
      teamwork: 0,
      leadership: 0,
      strengths: '',
      improvements: ''
    });
    setSelectedTeammate(null);
    setShowSubmitForm(false);
    setActiveTab('received');
    setGivenCount((count) => count + 1);
  };

  const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (val: number) => void; readonly?: boolean }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= value
                  ? 'fill-[#FFA45E] text-[#FFA45E]'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Peer Reviews</h1>
          <p className="text-muted-foreground">Give and receive anonymous feedback from your teammates</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#543884]/10">
              <Star className="w-5 h-5 text-[#543884]" />
            </div>
            <p className="text-sm text-muted-foreground">Your Average Rating</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{avgRating} / 5.0</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#9A77CF]/10">
              <Award className="w-5 h-5 text-[#9A77CF]" />
            </div>
            <p className="text-sm text-muted-foreground">Reviews Received</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{totalReviews}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#EC4176]/10">
              <TrendingUp className="w-5 h-5 text-[#EC4176]" />
            </div>
            <p className="text-sm text-muted-foreground">Reviews Given</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{givenCount}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'received'
              ? 'text-[#543884] dark:text-[#9A77CF]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Reviews Received
          {activeTab === 'received' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#543884] dark:bg-[#9A77CF]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('submit')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'submit'
              ? 'text-[#543884] dark:text-[#9A77CF]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Submit Review
          {activeTab === 'submit' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#543884] dark:bg-[#9A77CF]" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'received' ? (
        <div className="space-y-4">
          {receivedReviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="w-4 h-4 text-[#543884]" />
                        <h3 className="text-lg font-semibold text-foreground">{review.project}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{review.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(review.reviewDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
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
                  </div>

                  {/* Review Text */}
                  <div className="mb-4 p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-foreground leading-relaxed">{review.review}</p>
                  </div>

                  {/* Category Ratings */}
                  <div className="mb-4">
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

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {review.improvements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Areas for Growth</h4>
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {!showSubmitForm ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Select a Teammate to Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teammates.map((teammate) => (
                      <button
                        key={teammate.id}
                        onClick={() => {
                          setSelectedTeammate(teammate);
                          setShowSubmitForm(true);
                        }}
                        className="p-4 rounded-xl border-2 border-border hover:border-[#543884] transition-all text-left hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white font-semibold">
                            {teammate.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{teammate.name}</p>
                            <p className="text-sm text-muted-foreground">{teammate.role}</p>
                            <Badge variant="secondary" size="sm">{teammate.department}</Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Review for {selectedTeammate?.name}</CardTitle>
                  <button
                    onClick={() => {
                      setShowSubmitForm(false);
                      setSelectedTeammate(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Project Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Project Name *</label>
                      <input
                        type="text"
                        value={formData.project}
                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                        placeholder="e.g., Mobile App Redesign"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Duration *</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 3 months"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                      />
                    </div>
                  </div>

                  {/* Category Ratings */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Rate Your Teammate *</label>
                    <div className="space-y-3">
                      {[
                        { key: 'communication', label: 'Communication' },
                        { key: 'technical', label: 'Technical Skills' },
                        { key: 'teamwork', label: 'Teamwork' },
                        { key: 'leadership', label: 'Leadership' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <span className="text-sm text-foreground">{label}</span>
                          <StarRating
                            value={formData[key as keyof typeof formData] as number}
                            onChange={(val) => setFormData({ ...formData, [key]: val })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Your Review *</label>
                    <textarea
                      value={formData.review}
                      onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                      placeholder="Share your honest feedback about working with this teammate..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#9A77CF] resize-none"
                    />
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Strengths (Optional)</label>
                      <textarea
                        value={formData.strengths}
                        onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                        placeholder="e.g., Great communicator, Problem solver"
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#9A77CF] resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Areas for Growth (Optional)</label>
                      <textarea
                        value={formData.improvements}
                        onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                        placeholder="e.g., Time management, Documentation"
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#9A77CF] resize-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Anonymous Notice */}
                  <div className="p-4 bg-[#543884]/10 border border-[#543884]/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-[#543884] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Anonymous Feedback</p>
                        <p className="text-xs text-muted-foreground">
                          Your identity will remain completely anonymous. The reviewee will not know who provided this feedback.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitReview}
                    disabled={!formData.project || !formData.duration || !formData.review ||
                      formData.communication === 0 || formData.technical === 0 ||
                      formData.teamwork === 0 || formData.leadership === 0}
                    className="w-full gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Anonymous Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
