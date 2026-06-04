import { useParams } from "react-router-dom";
import { Mail, Phone, MapPin, Calendar, Briefcase, Award, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import * as Tabs from "@radix-ui/react-tabs";

export function EmployeeProfile() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => window.history.back()}>
        ← Back to Employees
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl flex-shrink-0">
              TH
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl text-foreground mb-1">Tanvir Hasan</h1>
                  <p className="text-muted-foreground">Senior Software Engineer • Information Technology</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  tanvir.hasan@hrspace.local
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  +8801712345678
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Gulshan, Dhaka
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs.Root defaultValue="overview" className="w-full">
        <Tabs.List className="flex gap-1 border-b border-border mb-6">
          {["Overview", "Documents", "Performance", "Leave History", "Payroll"].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab.toLowerCase().replace(" ", "-")}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Join Date</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Jan 15, 2022</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Experience</span>
                  </div>
                  <span className="text-sm text-muted-foreground">4.2 years</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Performance</span>
                  </div>
                  <Badge variant="success" size="sm">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Salary</span>
                  </div>
                  <span className="text-sm text-muted-foreground">BDT 95,000/month</span>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-muted-foreground">Employee ID</label>
                    <p className="text-foreground mt-1">EMP-001234</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground mt-1">March 15, 1990</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Gender</label>
                    <p className="text-foreground mt-1">Male</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Marital Status</label>
                    <p className="text-foreground mt-1">Single</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Nationality</label>
                    <p className="text-foreground mt-1">Bangladeshi</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Blood Group</label>
                    <p className="text-foreground mt-1">O+</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Department</label>
                  <p className="text-foreground mt-1">Information Technology</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Job Title</label>
                  <p className="text-foreground mt-1">Senior Software Engineer</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Employment Type</label>
                  <p className="text-foreground mt-1">Full-time</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Reporting Manager</label>
                  <p className="text-foreground mt-1">Nusrat Jahan</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Work Location</label>
                  <p className="text-foreground mt-1">HRSpace Head Office, Gulshan, Dhaka</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Shift</label>
                  <p className="text-foreground mt-1">9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Contact Name</label>
                  <p className="text-foreground mt-1">Tasmia Noor</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Relationship</label>
                  <p className="text-foreground mt-1">Sister</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phone Number</label>
                  <p className="text-foreground mt-1">+8801811122233</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="text-foreground mt-1">tasmia.noor@example.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="documents">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Documents content would go here</p>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="performance">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Performance content would go here</p>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="leave-history">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Leave history content would go here</p>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="payroll">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Payroll content would go here</p>
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
