import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);
      if (!cancelled) {
        setFavoriteIds(new Set((data || []).map((f) => f.product_id)));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return;
      const wasFav = favoriteIds.has(productId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      if (wasFav) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
      }
    },
    [user?.id, favoriteIds],
  );

  return { favoriteIds, toggle, loading };
}
