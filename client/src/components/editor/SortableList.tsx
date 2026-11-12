import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Drag-and-drop list (mouse, touch and keyboard: focus the handle, press Space, use arrows).
 * Items need a stable `id`.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  render,
  grid,
  className,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  render: (item: T, index: number, handle: ReactNode) => ReactNode;
  grid?: boolean;
  className?: string;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, i) => (
            <SortableItem key={item.id} id={item.id}>
              {(handle) => render(item, i, handle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center rounded text-ink-subtle hover:bg-surface-sunken hover:text-ink active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('relative', isDragging && 'z-20 opacity-90 shadow-raised')}>
      {children(handle)}
    </div>
  );
}

let counter = 0;
/** Give list items stable ids for drag-and-drop (not persisted). */
export const withIds = <T,>(arr: T[]) => arr.map((x) => ({ ...x, id: `k${++counter}` }));
export const newId = () => `k${++counter}`;
export const stripIds = <T extends { id: string }>(arr: T[]) => arr.map(({ id: _id, ...rest }) => rest);
