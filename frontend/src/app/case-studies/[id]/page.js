'use client';

import { CaseStudyDetail } from '@/components/case-studies/CaseStudyDetail';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function CaseStudyDetailPage() {
  const params = useParams();
  
  return (
    <>
      <div className="absolute top-4 left-4 z-50">
        <Link href="/case-studies">
          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </Link>
      </div>
      <CaseStudyDetail caseStudyId={params.id} />
    </>
  );
}
