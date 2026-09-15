import { getLedgerDB } from "./db";
import type { Strategy } from "@/types/ledger";
import { generateId } from "@/lib/utils";

const db = () => getLedgerDB();

export async function createStrategy(data: Partial<Strategy>): Promise<Strategy> {
  const now = Date.now();
  const strategy: Strategy = {
    name: data.name ?? "Untitled Strategy",
    createdAt: now,
    updatedAt: now,
    ...data,
    id: data.id ?? generateId(),
  };
  await db().strategies.add(strategy);
  return strategy;
}

export async function updateStrategy(id: string, data: Partial<Strategy>): Promise<void> {
  await db().strategies.update(id, { ...data, updatedAt: Date.now() });
}

export async function deleteStrategy(id: string): Promise<void> {
  await db().strategies.delete(id);
}

export async function getStrategy(id: string): Promise<Strategy | undefined> {
  return db().strategies.get(id);
}

export async function getAllStrategies(): Promise<Strategy[]> {
  return db().strategies.toArray();
}

export async function getActiveStrategies(): Promise<Strategy[]> {
  const all = await db().strategies.toArray();
  return all.filter((s) => !s.archived);
}

export async function duplicateStrategy(id: string): Promise<Strategy | null> {
  const original = await db().strategies.get(id);
  if (!original) return null;
  const now = Date.now();
  const copy: Strategy = {
    ...original,
    id: generateId(),
    name: `${original.name} (Copy)`,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await db().strategies.add(copy);
  return copy;
}

export async function archiveStrategy(id: string): Promise<void> {
  await db().strategies.update(id, { archived: true, updatedAt: Date.now() });
}

export async function unarchiveStrategy(id: string): Promise<void> {
  await db().strategies.update(id, { archived: false, updatedAt: Date.now() });
}
