import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, PlusCircle, User } from "lucide-react";

interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const CommunityForum = () => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: "Farmer John",
      content: "Anyone having issues with early blight on tomatoes this season?",
      timestamp: "2025-09-16T10:30:00Z",
    },
    {
      id: "2",
      author: "AgriExpert Sarah",
      content: "Try neem oil spray and ensure good air circulation. Also, check soil pH.",
      timestamp: "2025-09-16T11:00:00Z",
    },
  ]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostAuthor, setNewPostAuthor] = useState("Anonymous"); // Placeholder for user name

  const handleNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPostContent.trim()) {
      const newPost: Post = {
        id: Date.now().toString(),
        author: newPostAuthor || "Anonymous",
        content: newPostContent.trim(),
        timestamp: new Date().toISOString(),
      };
      setPosts((prevPosts) => [newPost, ...prevPosts]);
      setNewPostContent("");
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Community Forum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNewPost} className="space-y-4">
            <div>
              <Input
                placeholder="Your Name (optional)"
                value={newPostAuthor}
                onChange={(e) => setNewPostAuthor(e.target.value)}
                className="mb-2"
              />
              <Textarea
                placeholder="Share your thoughts or ask a question..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" /> Create Post
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{post.author}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm">{post.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CommunityForum;