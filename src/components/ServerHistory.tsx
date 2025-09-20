import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ArtaiService, { Category, ImageItem, Paginated, Tag } from '../services/ArtaiService';
import { Button } from './ui/Button';
import { X } from 'lucide-react';

function CategoryBadge({ name }: { name: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">
      {name}
    </span>
  );
}

function ImageCard({
  img,
  categories,
  onDelete,
}: {
  img: ImageItem;
  categories: Category[] | undefined;
  onDelete: (id: number) => void;
}) {
  const queryClient = useQueryClient();

  const { data: imgCats } = useQuery<{ image_id: number; categories: Category[] }>({
    queryKey: ['image-categories', img.id],
    queryFn: () => ArtaiService.getImageCategories(img.id),
    staleTime: 60 * 1000,
  });

  const setCatsMutation = useMutation({
    mutationFn: (ids: number[]) => ArtaiService.setImageCategories(img.id, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-categories', img.id] });
    },
  });

  const url = toAbsoluteUrl(img.file_path);
  const assigned = imgCats?.categories || [];
  const [newCatId, setNewCatId] = React.useState<number | null>(null);

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden bg-gray-900">
      <div className="relative aspect-square w-full bg-gray-800">
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img src={url} alt={img.title || 'Image'} className="w-full h-full object-cover" />
        {/* Delete button (X) in top-right */}
        <button
          className="absolute top-2 right-2 bg-gray-900/80 hover:bg-red-600 text-gray-200 hover:text-white rounded-full h-7 w-7 inline-flex items-center justify-center border border-gray-700"
          title="Delete image"
          onClick={() => onDelete(img.id)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <div className="text-sm font-medium text-gray-200 truncate" title={img.title}>{img.title || `#${img.id}`}</div>
        {img.description && (
          <div className="text-xs text-gray-400 line-clamp-2" title={img.description}>{img.description}</div>
        )}
        <div className="text-[11px] text-gray-500">{img.status || 'uploaded'} • {new Date(img.created_at || '').toLocaleString()}</div>
        <a href={url} target="_blank" rel="noreferrer" className="text-[11px] text-yellow-400 hover:underline break-all">
          {url}
        </a>

        {/* Assigned Categories */}
        <div className="pt-2">
          <label className="text-[10px] uppercase tracking-wide text-gray-500">Categories</label>
          <div className="mt-1 flex flex-wrap gap-1">
            {assigned.length === 0 ? (
              <span className="text-[11px] text-gray-500">— none —</span>
            ) : (
              assigned.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">
                  {c.name}
                  <button
                    className="ml-1 text-gray-400 hover:text-red-400"
                    title="Remove"
                    onClick={() => {
                      const newIds = assigned.filter((x) => x.id !== c.id).map((x) => x.id);
                      setCatsMutation.mutate(newIds);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Select + Add (no checkbox list) */}
        <div className="mt-3 flex items-center gap-2">
          {categories && categories.length > 0 ? (
            <>
              <select
                className="h-8 px-2 bg-gray-950 border border-gray-700 rounded text-xs text-gray-100 flex-1"
                value={newCatId ?? ''}
                onChange={(e) => setNewCatId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select category…</option>
                {categories
                  .filter((c) => !assigned.some((a) => a.id === c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={!newCatId || setCatsMutation.isPending}
                onClick={() => {
                  if (!newCatId) return;
                  const newIds = Array.from(new Set([...assigned.map((a) => a.id), newCatId!]));
                  setCatsMutation.mutate(newIds);
                  setNewCatId(null);
                }}
              >
                Add
              </Button>
            </>
          ) : (
            <span className="text-[11px] text-gray-500">No categories. Create one above.</span>
          )}
          {setCatsMutation.isPending && (
            <span className="text-[11px] text-gray-500">Saving…</span>
          )}
        </div>
      </div>
    </div>
  );
}

function toAbsoluteUrl(filePath: string): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  // Ensure single leading slash
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `https://crm.actium.ro${path}`;
}

export default function ServerHistory() {
  const [page, setPage] = React.useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<Paginated<ImageItem>>({
    queryKey: ['server-images', page, selectedCategoryId],
    queryFn: () => ArtaiService.listImages({ page, category_id: selectedCategoryId ?? undefined }),
    keepPreviousData: true,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => ArtaiService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: tags } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => ArtaiService.getTags(),
    staleTime: 10 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ArtaiService.deleteImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-images'] });
    },
  });


  const addTagMutation = useMutation({
    mutationFn: (name: string) => ArtaiService.createTag({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (input: { name: string; description?: string }) => ArtaiService.createCategory(input),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      const id = res?.category?.id;
      if (typeof id === 'number') setSelectedCategoryId(id);
      setNewCategoryName('');
    },
  });

  const items = data?.data || [];
  const totalPages = data?.last_page || 1;

  return (
    <div className="h-full w-full bg-gray-950 text-gray-100 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-300">History</h2>
          <p className="text-xs text-gray-500">Server images from your account</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Categories Toolbar */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Categories:</span>
          <button
            className={`text-xs px-2 py-1 rounded border ${selectedCategoryId === null ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600'}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            All
          </button>
          {(categories || []).map((c) => (
            <button
              key={c.id}
              className={`text-xs px-2 py-1 rounded border ${selectedCategoryId === c.id ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600'}`}
              onClick={() => setSelectedCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
          {(!categories || categories.length === 0) && (
            <span className="text-xs text-gray-500">No categories yet. Add one →</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category"
            className="h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-100"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const name = newCategoryName.trim();
              if (!name) return;
              createCategoryMutation.mutate({ name });
            }}
            disabled={createCategoryMutation.isPending}
            title="Add category"
          >
            +
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
        </div>
      ) : isError ? (
        <div className="flex-1 flex items-center justify-center text-red-300 text-sm px-6 text-center">
          {(error as any)?.message || 'Failed to load images.'}
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          No images found.
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((img) => (
              <ImageCard
                key={img.id}
                img={img}
                categories={categories}
                onDelete={(id) => {
                  if (confirm('Ștergi această imagine?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between text-sm">
        <div className="text-xs text-gray-500">Page {data?.current_page || page} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(data?.current_page || 1) <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(data?.current_page || 1) >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
