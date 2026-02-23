import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="space-y-3 text-center">
        <div className="text-2xl font-semibold">404</div>
        <div className="opacity-70">Page not found</div>
        <Button
          onClick={() => {
            void nav('/', { replace: true });
          }}
        >
          Go home
        </Button>
      </div>
    </div>
  );
}
