'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import Modal from '@/components/admin/Modal'

const emptyProduct = {
  name: '',
  shortDescription: '',
  tagline: '',
  price: '',
  period: 'year',
  image: '',
  features: [''],
  highlights: [{ title: '', description: '' }],
  popular: false,
  active: true
}

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])
  
  useEffect(() => {
    if (session) {
      fetchProducts()
    }
  }, [session])
  
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const openNewProduct = () => {
    setEditingProduct(null)
    setFormData(emptyProduct)
    setShowModal(true)
  }
  
  const openEditProduct = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      shortDescription: product.shortDescription || '',
      tagline: product.tagline || '',
      price: product.price?.toString() || '',
      period: product.period || 'year',
      image: product.image || '',
      features: product.features?.length ? product.features : [''],
      highlights: product.highlights?.length ? product.highlights : [{ title: '', description: '' }],
      popular: product.popular || false,
      active: product.active !== false
    })
    setShowModal(true)
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'
      
      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features: formData.features.filter(f => f.trim()),
          highlights: formData.highlights.filter(h => h.title.trim())
        })
      })
      
      if (res.ok) {
        fetchProducts()
        setShowModal(false)
      }
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? ${product._count?.orders > 0 ? 'This product has orders and will be deactivated instead.' : ''}`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }
  
  const addFeature = () => {
    setFormData(f => ({ ...f, features: [...f.features, ''] }))
  }
  
  const updateFeature = (index, value) => {
    const features = [...formData.features]
    features[index] = value
    setFormData(f => ({ ...f, features }))
  }
  
  const removeFeature = (index) => {
    setFormData(f => ({ ...f, features: f.features.filter((_, i) => i !== index) }))
  }
  
  const addHighlight = () => {
    setFormData(f => ({ ...f, highlights: [...f.highlights, { title: '', description: '' }] }))
  }
  
  const updateHighlight = (index, field, value) => {
    const highlights = [...formData.highlights]
    highlights[index][field] = value
    setFormData(f => ({ ...f, highlights }))
  }
  
  const removeHighlight = (index) => {
    setFormData(f => ({ ...f, highlights: f.highlights.filter((_, i) => i !== index) }))
  }
  
  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null
  
  const columns = [
    {
      header: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image && (
            <img src={row.image} alt={row.name} className="w-10 h-10 rounded-lg object-cover" />
          )}
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            {!row.active && <span className="text-xs text-gray-500">(Inactive)</span>}
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      render: (row) => `$${row.price}/${row.period || 'one-time'}`
    },
    {
      header: 'Orders',
      render: (row) => row._count?.orders || 0
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEditProduct(row) }}
            className="text-emerald-600 hover:text-emerald-800"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      )
    }
  ]
  
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={openNewProduct}
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
        >
          + Add Product
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          emptyMessage="No products yet. Add your first product!"
        />
      )}
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'New Product'}
        size="xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData(f => ({ ...f, shortDescription: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <textarea
                value={formData.tagline}
                onChange={(e) => setFormData(f => ({ ...f, tagline: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData(f => ({ ...f, period: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
                <option value="3 months">3 Months</option>
                <option value="6 months">6 Months</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData(f => ({ ...f, image: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="/images/product.png"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
              {formData.features.map((feature, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(i, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Feature description"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
              >
                + Add Feature
              </button>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Highlights</label>
              {formData.highlights.map((highlight, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={highlight.title}
                    onChange={(e) => updateHighlight(i, 'title', e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={highlight.description}
                    onChange={(e) => updateHighlight(i, 'description', e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Description"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlight(i)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addHighlight}
                className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
              >
                + Add Highlight
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.popular}
                  onChange={(e) => setFormData(f => ({ ...f, popular: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Popular</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(f => ({ ...f, active: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.price}
              className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
