import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { renderField } from "../../lib/entityFieldMapper";
import {
  entityRegistry,
  perm,
  actionPerm,
  ALL_OPERATIONS,
} from "../../lib/entityRegistry";
import { useRbac } from "../../lib/rbac";
import type { EntityMeta } from "../../types/entity";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete, Edit, View } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/$model/list")({
  loader: async ({ params }) => {
    const [entitiesRes, recordsRes] = await Promise.all([
      fetch("/api/entities"),
      fetch(`/api/${params.model}`),
    ]);
    const entities: EntityMeta[] = await entitiesRes.json();
    const records: Record<string, unknown>[] = await recordsRes.json();
    const entity = entities.find((e) => e.name === params.model);
    return { entity, records };
  },
  component: ListComponent,
});

function ListComponent() {
  const { model } = Route.useParams();
  const { entity, records } = Route.useLoaderData();
  const config = entityRegistry.get(model);

  if (!entity) {
    return <div className="p-6 text-red-500">Entity "{model}" not found.</div>;
  }

  if (config.list?.component) {
    const Custom = config.list.component;
    return <Custom model={model} entity={entity} records={records} />;
  }

  return (
    <DefaultList
      model={model}
      entity={entity}
      records={records}
      config={config}
    />
  );
}

function DefaultList({
  model,
  entity,
  records,
  config,
}: {
  model: string;
  entity: EntityMeta;
  records: Record<string, unknown>[];
  config: ReturnType<typeof entityRegistry.get>;
}) {
  const router = useRouter();
  const { can } = useRbac();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<
    { id: string } | "bulk" | null
  >(null);
  const listConfig = config.list ?? {};
  const ops = new Set(config.operations ?? ALL_OPERATIONS);
  const actions = (config.actions ?? []).filter((a) =>
    can(actionPerm(a, model)),
  );

  const canShow = ops.has("show") && can(perm(config, model, "show"));
  const canEdit = ops.has("edit") && can(perm(config, model, "edit"));
  const canCreate = ops.has("create") && can(perm(config, model, "create"));
  const canDelete = ops.has("delete") && can(perm(config, model, "delete"));
  const hasActions = canShow || canEdit || canDelete || actions.length > 0;

  const columns = useMemo(() => {
    const fields = entity.fields.filter((f) => f.name !== "password");
    if (listConfig.columns) {
      return listConfig.columns
        .map((name) => fields.find((f) => f.name === name))
        .filter(Boolean) as typeof fields;
    }
    return fields;
  }, [entity, listConfig.columns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((record) =>
      columns.some((field) => {
        const v = record[field.name];
        return (
          v !== null && v !== undefined && String(v).toLowerCase().includes(q)
        );
      }),
    );
  }, [records, columns, search]);

  const filteredIds = filtered.map((r) => String(r.id));
  const allSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someSelected = filteredIds.some((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...filteredIds]));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function confirmAndDelete() {
    if (!confirmDelete) return;
    setConfirmDelete(null);
    if (confirmDelete === "bulk") {
      setBulkDeleting(true);
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/${model}/${id}`, { method: "DELETE" }),
        ),
      );
      setSelected(new Set());
      setBulkDeleting(false);
    } else {
      setDeleting(confirmDelete.id);
      await fetch(`/api/${model}/${confirmDelete.id}`, { method: "DELETE" });
      setDeleting(null);
    }
    router.invalidate();
  }

  const deleteTargetLabel =
    confirmDelete === "bulk"
      ? `${selected.size} records`
      : confirmDelete && typeof confirmDelete === "object"
        ? `record # ${confirmDelete.id}`
        : "";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold capitalize">{model}</h1>
          <span className="text-sm text-muted-foreground">
            {search
              ? `${filtered.length} of ${records.length}`
              : records.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && selected.size > 0 && (
            <button
              onClick={() => setConfirmDelete("bulk")}
              disabled={bulkDeleting}
              className="px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50"
            >
              {bulkDeleting ? "…" : `Delete ${selected.size} selected`}
            </button>
          )}
          {canCreate && (
            <Link to="/$model/$id/edit" params={{ model, id: "new" }}>
              <button className="px-4 py-2 bg-foreground text-background text-sm">
                New
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Input
          placeholder={`Search ${model}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="overflow-x-auto border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              {canDelete && (
                <th className="px-4 py-3 w-8">
                  <Checkbox
                    checked={someSelected && !allSelected ? "indeterminate" : allSelected}
                    onCheckedChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((field) => (
                <th
                  key={field.name}
                  className="px-4 py-3 text-left font-medium"
                >
                  {field.name}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((record) => {
              const id = String(record.id);
              return (
                <tr
                  key={id}
                  className={
                    listConfig.rowClassName?.(record) ??
                    "hover:bg-muted/50 transition-colors"
                  }
                >
                  {canDelete && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(id)}
                        onCheckedChange={() => toggleOne(id)}
                      />
                    </td>
                  )}
                  {columns.map((field) => (
                    <td key={field.name} className="px-4 py-3">
                      {listConfig.renderCell
                        ? listConfig.renderCell(
                            field,
                            record[field.name],
                            record,
                          )
                        : renderField(field, record[field.name])}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {canShow && (
                          <Link to="/$model/$id/show" params={{ model, id }}>
                            <button className="px-2 py-1 border border-blue-200 text-xs text-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 flex gap-2">
                              <HugeiconsIcon size={14} icon={View} />
                              <span>View</span>
                            </button>
                          </Link>
                        )}
                        {canEdit && (
                          <Link to="/$model/$id/edit" params={{ model, id }}>
                            <button className="px-2 py-1 border text-xs text-amber-600 hover:bg-amber-50 border-amber-200 dark:text-amber-400 dark:hover:bg-amber-950 dark:border-amber-800 flex gap-2">
                              <HugeiconsIcon size={14} icon={Edit} />{" "}
                              <span>Edit</span>
                            </button>
                          </Link>
                        )}
                        {actions.map((action) => (
                          <button
                            key={action.label}
                            disabled={running === `${action.label}:${id}`}
                            className={
                              action.className ??
                              "px-3 py-1 border text-xs text-foreground border-border hover:bg-muted"
                            }
                            onClick={async () => {
                              if (action.confirm && !confirm(action.confirm))
                                return;
                              const key = `${action.label}:${id}`;
                              setRunning(key);
                              await action.handler(id, model);
                              setRunning(null);
                              router.invalidate();
                            }}
                          >
                            {running === `${action.label}:${id}`
                              ? "…"
                              : action.label}
                          </button>
                        ))}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete({ id })}
                            disabled={deleting === id}
                            className="px-2 py-1 border border-red-200 text-red-600 text-xs hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 flex gap-2"
                          >
                            {deleting === id ? (
                              "…"
                            ) : (
                              <>
                                <HugeiconsIcon size={14} icon={Delete} />{" "}
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={
                    columns.length + (canDelete ? 1 : 0) + (hasActions ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {search
                    ? "No records match your search."
                    : "No records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTargetLabel}?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmAndDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
