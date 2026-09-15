import { getLedgerDB } from "./db";
import type { DailyJournal } from "@/types/ledger";
import { generateId } from "@/lib/utils";

const db = () => getLedgerDB();

export async function createJournal(data: Partial<DailyJournal>): Promise<DailyJournal> {
  const now = Date.now();
  const journal: DailyJournal = {
    date: data.date ?? new Date().toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
    ...data,
    id: data.id ?? generateId(),
  };
  await db().journals.add(journal);
  return journal;
}

export async function updateJournal(id: string, data: Partial<DailyJournal>): Promise<void> {
  await db().journals.update(id, { ...data, updatedAt: Date.now() });
}

export async function deleteJournal(id: string): Promise<void> {
  await db().journals.delete(id);
}

export async function getJournal(id: string): Promise<DailyJournal | undefined> {
  return db().journals.get(id);
}

export async function getJournalByDate(date: string): Promise<DailyJournal | undefined> {
  const all = await db().journals.where("date").equals(date).toArray();
  return all[0];
}

export async function getAllJournals(): Promise<DailyJournal[]> {
  const journals = await db().journals.toArray();
  return journals.sort((a, b) => b.date.localeCompare(a.date));
}
