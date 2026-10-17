'use client';

import { CaseStudyDetail } from '@/components/case-studies/CaseStudyDetail';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function CaseStudyDetailPage() {
  const params = useParams();
  
  return (
    <>
      <div className="absolute top-4 left-4 z-50">
        <Link href="/case-studies">
          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground bg-card px-4 py-2 rounded-lg shadow-md border border-border">
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </Link>
      </div>
      <CaseStudyDetail caseStudyId={params.id} />
    </>
  );
}
