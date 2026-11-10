import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function ReceiptLink({ fileUri }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!fileUri) return undefined;
    let cancelled = false;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 3600 })
      .then((res) => {
        if (!cancelled) setUrl(res.signed_url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fileUri]);

  if (!fileUri) return null;

  return (
    <Button asChild variant="outline" size="sm" disabled={!url}>
      <a href={url || '#'} target="_blank" rel="noreferrer">
        <Paperclip className="h-3.5 w-3.5" />
        {url ? 'View receipt' : 'Preparing receipt…'}
      </a>
    </Button>
  );
}