import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Gem, LogIn } from 'lucide-react';

export default function LoginPrompt() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-elegant">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Gem className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">Welcome to Jewellery Orders</CardTitle>
          <CardDescription className="mt-2">
            Please login to manage your jewellery orders and billing
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full gap-2"
          size="lg"
        >
          {isLoggingIn ? (
            'Logging in...'
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Login with Internet Identity
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

