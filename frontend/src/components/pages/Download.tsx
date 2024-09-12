import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Download, Search, Upload } from "lucide-react";

// Mock data for demonstration
const resources = [
  {
    id: 1,
    name: "K-Scale Core Kernel",
    type: "kernel",
    official: true,
    downloads: 1200,
  },
  {
    id: 2,
    name: "Robotic Arm URDF",
    type: "urdf",
    official: true,
    downloads: 850,
  },
  {
    id: 3,
    name: "Object Detection Model",
    type: "ml",
    official: true,
    downloads: 2000,
  },
  {
    id: 4,
    name: "Custom Kernel by user123",
    type: "kernel",
    official: false,
    downloads: 300,
  },
  { id: 5, name: "Drone URDF", type: "urdf", official: false, downloads: 450 },
  {
    id: 6,
    name: "Sentiment Analysis Model",
    type: "ml",
    official: false,
    downloads: 600,
  },
  {
    id: 7,
    name: "K-Scale Documentation",
    type: "other",
    official: true,
    downloads: 3000,
  },
  {
    id: 8,
    name: "Community Guidelines",
    type: "other",
    official: true,
    downloads: 500,
  },
];

export default function DownloadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredResources = resources.filter(
    (resource) =>
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeTab === "all" || resource.type === activeTab),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">K-Scale Downloads</h1>
      <p className="text-muted-foreground mb-6">
        View and download official K-Scale and community uploaded kernel images,
        URDFs, ML models, and more
      </p>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload Resource
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="kernel">Kernel Images</TabsTrigger>
          <TabsTrigger value="urdf">URDFs</TabsTrigger>
          <TabsTrigger value="ml">ML Models</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {resource.name}
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      resource.type === "kernel" && "bg-blue-100 text-blue-800",
                      resource.type === "urdf" && "bg-green-100 text-green-800",
                      resource.type === "ml" && "bg-purple-100 text-purple-800",
                      resource.type === "other" && "bg-gray-100 text-gray-800",
                    )}
                  >
                    {resource.type}
                  </Badge>
                  {resource.official && (
                    <Badge variant="secondary">Official</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Downloads: {resource.downloads}
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No resources found matching your search criteria.
        </p>
      )}
    </div>
  );
}
