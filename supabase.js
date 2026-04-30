const SUPABASE_URL = 'https://gubckjmffliwukroluxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1YmNram1mZmxpd3Vrcm9sdXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDA4NDYsImV4cCI6MjA5MzExNjg0Nn0.qDuyWCltbNlIPsDdX8tUzZMF1VJgPXipH9wageTqTQw';

async function sbFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || '',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getCategories() {
  return sbFetch('categories?select=*&order=order.asc');
}

async function getProducts() {
  return sbFetch('products?select=*&order=order.asc');
}

async function updateProduct(id, data) {
  return sbFetch(`products?id=eq.${id}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: JSON.stringify(data)
  });
}

async function createProduct(data) {
  return sbFetch('products', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify(data)
  });
}

async function deleteProduct(id) {
  return sbFetch(`products?id=eq.${id}`, { method: 'DELETE' });
}

async function updateCategory(id, data) {
  return sbFetch(`categories?id=eq.${id}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: JSON.stringify(data)
  });
}

async function createCategory(data) {
  return sbFetch('categories', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify(data)
  });
}

async function uploadImage(file) {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/menu-images/${filename}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type,
      'x-upsert': 'true'
    },
    body: file
  });
  if (!res.ok) throw new Error('Image upload failed');
  return `${SUPABASE_URL}/storage/v1/object/public/menu-images/${filename}`;
}
