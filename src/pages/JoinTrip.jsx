import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function JoinTrip() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('working');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await base44.functions.invoke('joinTrip', { token });
        const data = response.data || {};
        if (cancelled) return;
        if (data.error) {
          setStatus('error');
          setMessage(data.error);
          return;
        }
        if (data.already_member) {
          navigate(`/trips/${data.trip_id}`, { replace: true });
          return;
        }
        setStatus('done');
        setTimeout(() => navigate(`/trips/${data.trip_id}`, { replace: true }), 700);
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(error?.response?.data?.error || 'This invite link is not valid any more.');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card-surface w-full max-w-sm p-8 text-center">
        {status === 'working' ? (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <h1 className="mt-4 text-xl">Joining the trip…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Checking your invite.</p>
          </>
        ) : status === 'done' ? (
          <>
            <h1 className="text-xl">You are in</h1>
            <p className="mt-2 text-sm text-muted-foreground">Opening the trip now.</p>
          </>
        ) : (
          <>
            <TriangleAlert className="mx-auto h-6 w-6 text-warning" />
            <h1 className="mt-4 text-xl">Invite not usable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/trips">My trips</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
