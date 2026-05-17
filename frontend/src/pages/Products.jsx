import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

function money(cents) { return `$${(cents / 100).toFixed(2)}`; }

export default function Products() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get('/products/products', { params });
      setItems(data.items);
    } finally { setLoading(false); }
  };

  useEffect(() => { api.get('/products/categories').then((r) => setCats(r.data.items)).catch(() => {}); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category]);

  const addToCart = async (id) => {
    if (!token) return alert('Please log in first.');
    try { await api.post('/orders/cart', { product_id: id, quantity: 1 }); alert('Added to cart!'); }
    catch (e) { alert(e.response?.data?.error || 'Failed to add'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Products</h1>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && load()}
               placeholder="Search..." className="border rounded px-3 py-1.5 flex-1" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded px-3 py-1.5">
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <button onClick={load} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">Search</button>
      </div>

      {loading ? <p>Loading…</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className="bg-white rounded shadow-sm border p-3 flex flex-col">
              <Link to={`/products/${p.id}`}>
                <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover rounded mb-2" />
                <h3 className="font-semibold">{p.name}</h3>
              </Link>
              <p className="text-sm text-gray-500 flex-1">{p.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold">{money(p.price_cents)}</span>
                <button onClick={() => addToCart(p.id)} disabled={p.in_stock <= 0}
                        className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-green-700">
                  {p.in_stock > 0 ? 'Add to cart' : 'Out of stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
