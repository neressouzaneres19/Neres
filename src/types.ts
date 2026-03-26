export interface Batch {
  id: string;
  name: string;
  weightKg: number;
}

export interface Mixture {
  id: string;
  name: string;
  number: string;
  batches: Batch[];
  secondaryBatches: Batch[];
  createdAt: number;
  updatedAt: number;
}
