import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-16 max-w-lg mx-auto px-4">
      <Card variant="elevated" className="text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">404: Route Not Found</CardTitle>
          <CardDescription>
            The requested path does not exist in the NextEra Coders routing directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Check the URL or navigate back to the home page.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link to={ROUTES.HOME}>
            <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Return to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
