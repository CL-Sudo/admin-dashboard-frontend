import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '@/api/auth';
import { getErrorMessage } from '@/lib/httpError';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    resetToken: z.string().min(20, 'Reset token is too short'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine(v => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const tokenFromUrl = useMemo(() => sp.get('token') ?? '', [sp]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      resetToken: tokenFromUrl,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const mut = useMutation({
    mutationFn: (v: FormValues) =>
      resetPassword({
        resetToken: v.resetToken,
        newPassword: v.newPassword,
      }),
    onSuccess: () => {
      toast('Password updated', {
        description: 'You can now log in with your new password.',
      });
      nav('/login', { replace: true });
    },
    onError: e =>
      toast('Reset failed', {
        description: getErrorMessage(e),
      }),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(v => mut.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Reset Token</Label>
              <Input
                {...form.register('resetToken')}
                placeholder="Paste token here"
              />
              {form.formState.errors.resetToken && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.resetToken.message}
                </p>
              )}
              <p className="text-xs opacity-70">
                For dev: get token from Users → “Request password
                reset”.
              </p>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                {...form.register('newPassword')}
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={mut.isPending}
            >
              {mut.isPending ? 'Updating...' : 'Update password'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => nav('/login')}
            >
              Back to login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
