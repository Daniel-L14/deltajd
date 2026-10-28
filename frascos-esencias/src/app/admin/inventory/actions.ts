'use me'
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateStock(inventoryId: string, newStock: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('inventory')
    .update({ stock_quantity: newStock, last_updated: new Date().toISOString() })
    .eq('id', inventoryId);

  if (error) {
    throw new Error('Error al actualizar el inventario: ' + error.message);
  }

  revalidatePath('/admin/inventory');
}