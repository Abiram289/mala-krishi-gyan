import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (authMethod: 'email' | 'phone') => {
    setLoading(true);
    try {
      const credentials = authMethod === 'email' 
        ? { email, password }
        : { phone, password };

      const { data, error } = await supabase.auth.signUp({
        ...credentials,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) throw error;

      // Success!
      toast({
        title: 'Account Created',
        description: "Please check your email (or phone) for a confirmation message.",
      });
      // Do NOT navigate here. Let the user confirm their account first.

    } catch (error: any) {
      toast({
        title: 'Sign-up Error',
        description: error.message || "An unexpected error occurred.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      // On successful sign-in, the onAuthStateChange listener in App.tsx
      // will handle the session update and profile fetching.
      // We just need to navigate to the home page.
      toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
      navigate('/');

    } catch (error: any) {
      toast({
        title: 'Sign-in Error',
        description: error.message || "Invalid login credentials.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md mx-4">
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          {/* Sign In Tab */}
          <TabsContent value="signin">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Loading...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" type="text" placeholder="your_username" required value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input id="email-signup" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password-signup">Password</Label>
                <Input id="password-signup" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={() => handleSignUp('email')} className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Sign Up with Email'}
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthForm;