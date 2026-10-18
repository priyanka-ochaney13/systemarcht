'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FilePlus2, FileText, LoaderCircle, Trash2 } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { deleteArchitectureDocument, getArchitectureDocuments } from '@/api/client';

const formatUpdated = (value) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function ArchitectureDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDocuments(await getArchitectureDocuments());
    } catch (loadError) {
      setError(loadError.response?.data?.detail || loadError.message || 'Could not load your documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (documentId) => {
    if (!window.confirm('Delete this architecture document and its saved reports?')) return;
    setDeletingId(documentId);
    setError('');
    try {
      await deleteArchitectureDocument(documentId);
      setDocuments((current) => current.filter((document) => document.id !== documentId));
    } catch (deleteError) {
      setError(deleteError.response?.data?.detail || deleteError.message || 'Could not delete the document.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My architecture documents</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your private designs and saved cost snapshots.
            </p>
          </div>
          <Link href="/playground?newDocument=true" className="sa-btn-primary h-10 shrink-0 self-start px-4 sm:self-auto">
            <FilePlus2 className="size-4" />
            New document
          </Link>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
            <button type="button" onClick={loadDocuments} className="ml-3 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Loading your documents…
          </div>
        ) : !error && documents.length === 0 ? (
          <section className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <FileText className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Start with a blank canvas</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create an architecture document to design, configure, and report on your system.
            </p>
            <Link href="/playground?newDocument=true" className="sa-btn-primary mx-auto mt-5 h-10 px-4">
              <FilePlus2 className="size-4" /> Create your first document
            </Link>
          </section>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <Link href={`/playground?document=${encodeURIComponent(document.id)}`} className="group flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium group-hover:text-primary">{document.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Updated {formatUpdated(document.updated_at)} · {document.diagram_data?.nodes?.length || 0} services · {document.snapshots?.length || 0} reports
                    </span>
                  </span>
                </Link>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {document.snapshots?.length > 0 && (
                    <Link
                      href={`/documents/${encodeURIComponent(document.id)}/report?snapshot=${encodeURIComponent(document.snapshots[document.snapshots.length - 1].id)}`}
                      className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                    >
                      Latest report
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(document.id)}
                    disabled={deletingId === document.id}
                    aria-label={`Delete ${document.title}`}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
