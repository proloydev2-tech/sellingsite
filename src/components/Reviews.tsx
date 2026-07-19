import { useEffect, useState } from 'react';
import { Star, Loader2, Send, MessageSquare } from 'lucide-react';
import { supabase, type Review } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Props = { productId: string };

export default function Reviews({ productId }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('approved', true)
      .order('created_at', { ascending: false });
    setReviews((data as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please write a comment.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const author = name.trim() || (user?.user_metadata?.full_name as string) || (user?.email?.split('@')[0] as string) || 'Anonymous';
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user?.id || null,
      author_name: author,
      rating,
      comment: comment.trim(),
      approved: true,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setComment('');
      setName('');
      setRating(5);
      setTimeout(() => setSuccess(false), 2500);
      load();
    }
    setSubmitting(false);
  };

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          Customer reviews ({reviews.length})
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {avg.toFixed(1)} average
          </div>
        )}
      </div>

      {/* Submit review form */}
      <form onSubmit={submit} className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Write a review</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-6 w-6 transition ${
                    n <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 hover:text-amber-400'
                  }`}
                />
              </button>
            ))}
          </div>
          {!user && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          )}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience with this product..."
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
        {success && <p className="mt-2 text-xs font-medium text-emerald-600">Thanks! Your review was posted.</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post review
        </button>
      </form>

      {/* Reviews list */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="grid place-items-center py-6 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No reviews yet. Be the first to share your experience!
          </p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {r.author_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.author_name}</p>
                    <p className="text-[11px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{r.comment.replace(/\s*\[seeded\]\s*$/, '')}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
