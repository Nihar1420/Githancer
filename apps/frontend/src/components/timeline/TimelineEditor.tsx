'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import type { CommitQueueEntry, CommitStatus } from '@/lib/types';
import { useReorderQueue } from '@/hooks/useCommitQueue';
import { Badge } from '@/components/ui/Badge';

const statusVariant: Record<CommitStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
  pending: 'neutral',
  in_flight: 'info',
  executed: 'success',
  skipped: 'warning',
};

function DraggableCommitRow({
  entry,
  onSkip,
}: {
  entry: CommitQueueEntry;
  onSkip: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border-b border-gtm-border/50 bg-gtm-surface px-3 py-2 last:border-0"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gtm-muted"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <span className="w-8 text-xs text-gtm-muted">{entry.queueIndex}</span>
      <span className="flex-1 text-sm text-slate-200">
        {format(new Date(entry.scheduledAt), 'MMM d, yyyy HH:mm')}
      </span>
      <Badge variant={statusVariant[entry.status]}>{entry.status}</Badge>
      <button
        onClick={() => onSkip(entry.id)}
        className="text-xs text-gtm-danger transition-colors hover:underline"
      >
        skip
      </button>
    </div>
  );
}

export function TimelineEditor({
  projectId,
  queue,
}: {
  projectId: string;
  queue: CommitQueueEntry[];
}) {
  const [items, setItems] = useState<CommitQueueEntry[]>(queue);
  useEffect(() => setItems(queue), [queue]);

  const reorder = useReorderQueue(projectId);
  const sensors = useSensors(useSensor(PointerSensor));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex).map((it, idx) => ({ ...it, queueIndex: idx }));
    setItems(next); // optimistic
    reorder.mutate(next.map((i) => i.id));
  }

  function onSkip(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'skipped' as CommitStatus } : i)),
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-gtm-muted">Drag to reschedule</p>
      <div className="overflow-hidden rounded-xl border border-gtm-border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((entry) => (
              <DraggableCommitRow key={entry.id} entry={entry} onSkip={onSkip} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
