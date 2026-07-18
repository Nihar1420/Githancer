'use client';

import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { Navbar } from '@/components/layout/Navbar';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useProjects();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <Link href="/projects/new">
            <Button>New Project</Button>
          </Link>
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message="Could not load projects." onRetry={() => refetch()} />}
        {data && data.length === 0 && (
          <EmptyState
            title="No projects yet"
            hint="Create your first project to start scheduling commits."
            action={
              <Link href="/projects/new">
                <Button>Create your first project</Button>
              </Link>
            }
          />
        )}
        {data && data.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {data.map((item) => (
              <ProjectCard key={item.project.id} data={item} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
