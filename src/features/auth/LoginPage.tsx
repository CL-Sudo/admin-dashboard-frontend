import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { login } from '@/api/auth';
import { tokenStorage } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AxiosError } from 'axios';
import { getErrorMessage } from '@/lib/httpError';
import { Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (v: FormValues) => {
    try {
      setError(null);
      const data = await login(v.email, v.password);
      tokenStorage.setAccess(data.accessToken);
      tokenStorage.setRefresh(data.refreshToken);
      void navigate('/', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as AxiosError).response?.status === 401
          ? 'Invalid email or password'
          : getErrorMessage(err);
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            email: admin@example.com
          </p>
          <p className="mb-4 text-sm text-gray-600">
            password: Password1234!
          </p>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <form
            onSubmit={event => {
              event.preventDefault();
              void form.handleSubmit(values => onSubmit(values))(
                event
              );
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={form.formState.isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? 'Signing in...'
                : 'Sign in'}
            </Button>
            <div className="text-center text-sm">
              <a
                href="/reset-password"
                className="underline opacity-70 hover:opacity-100"
              >
                Reset Password
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
