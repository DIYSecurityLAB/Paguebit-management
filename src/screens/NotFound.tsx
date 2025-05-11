import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mt-4">Page Not Found</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/" className="mt-8 inline-block">
          <Button leftIcon={<Home className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}