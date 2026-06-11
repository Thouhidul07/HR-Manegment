import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Palette, Type, Layout, Box } from "lucide-react";

export function DesignSystem() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-foreground mb-2">Design System</h1>
        <p className="text-muted-foreground">
          Complete UI component library with full light/dark mode support
        </p>
      </div>

      {/* Colors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <CardTitle>Color System</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-20 rounded-lg bg-primary mb-2"></div>
              <p className="text-sm text-foreground">Primary</p>
              <p className="text-xs text-muted-foreground">Brand color</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-[var(--success)] mb-2"></div>
              <p className="text-sm text-foreground">Success</p>
              <p className="text-xs text-muted-foreground">Positive actions</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-[var(--warning)] mb-2"></div>
              <p className="text-sm text-foreground">Warning</p>
              <p className="text-xs text-muted-foreground">Caution states</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-destructive mb-2"></div>
              <p className="text-sm text-foreground">Destructive</p>
              <p className="text-xs text-muted-foreground">Error states</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            <CardTitle>Typography</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1>Heading 1 - Main page titles</h1>
            <p className="text-xs text-muted-foreground mt-1">2xl • Medium</p>
          </div>
          <div>
            <h2>Heading 2 - Section titles</h2>
            <p className="text-xs text-muted-foreground mt-1">xl • Medium</p>
          </div>
          <div>
            <h3>Heading 3 - Card titles</h3>
            <p className="text-xs text-muted-foreground mt-1">lg • Medium</p>
          </div>
          <div>
            <p className="text-base">Body text - Regular content and descriptions</p>
            <p className="text-xs text-muted-foreground mt-1">base • Normal</p>
          </div>
          <div>
            <p className="text-sm">Small text - Secondary information</p>
            <p className="text-xs text-muted-foreground mt-1">sm • Normal</p>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Variants</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Email" placeholder="john@example.com" type="email" />
            <Input label="Password" placeholder="••••••••" type="password" />
            <div className="w-full">
              <label className="block text-sm mb-1.5 text-foreground">
                Department
              </label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm h-10">
                <option value="">Select department</option>
                <option value="eng">Engineering</option>
                <option value="sales">Sales</option>
                <option value="hr">HR</option>
              </select>
            </div>
            <Input label="With Error" placeholder="Invalid input" error="This field is required" />
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            <CardTitle>Cards & Layouts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="mb-2">Card with shadow</h3>
              <p className="text-sm text-muted-foreground">
                Elevated cards use subtle shadows in light mode
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2">Bordered cards</h3>
              <p className="text-sm text-muted-foreground">
                Dark mode emphasizes borders over shadows
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2">Consistent spacing</h3>
              <p className="text-sm text-muted-foreground">
                8px grid system for all spacing
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Tanvir Hasan</TableCell>
                <TableCell>Developer</TableCell>
                <TableCell>
                  <Badge variant="success">Active</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Nusrat Jahan</TableCell>
                <TableCell>Designer</TableCell>
                <TableCell>
                  <Badge variant="success">Active</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Rakibul Islam</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>
                  <Badge variant="warning">On Leave</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Design Principles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            <CardTitle>Design Principles</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="mb-2">Light Mode</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Clean white/light gray backgrounds</li>
                <li>• Soft shadows for elevation</li>
                <li>• Dark text for maximum readability</li>
                <li>• Professional and minimal</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2">Dark Mode</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Deep gray backgrounds (not pure black)</li>
                <li>• Subtle borders instead of shadows</li>
                <li>• Muted text for comfort</li>
                <li>• Maintains accessibility standards</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
