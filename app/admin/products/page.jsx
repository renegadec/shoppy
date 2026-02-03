'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import ImageUpload from '@/components/admin/ImageUpload'

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
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
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
    setActiveTab('basic')
    setShowForm(true)
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
    setActiveTab('basic')
    setShowForm(true)
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
        setShowForm(false)
      }
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return
    
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

  // Show full-page form when adding/editing
  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
            >
              ← Back to Products
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingProduct ? 'Edit Product' : 'New Product'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.price}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'details', label: 'Details' },
            { id: 'features', label: 'Features' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-8">
                {/* Left: Image */}
                <div className="col-span-1">
                  <ImageUpload
                    value={formData.image}
                    onChange={(url) => setFormData(f => ({ ...f, image: url }))}
                  />
                </div>
                
                {/* Right: Basic Fields */}
                <div className="col-span-2 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                      placeholder="e.g., Google AI Combo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData(f => ({ ...f, shortDescription: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                      placeholder="Brief one-liner about the product"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (USD) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Period
                      </label>
                      <select
                        value={formData.period}
                        onChange={(e) => setFormData(f => ({ ...f, period: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow bg-white"
                      >
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                        <option value="3 months">3 Months</option>
                        <option value="6 months">6 Months</option>
                        <option value="one-time">One-time</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Toggles */}
              <div className="flex gap-6 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData(f => ({ ...f, popular: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">🔥 Mark as Popular</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(f => ({ ...f, active: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">✓ Active (visible in store)</span>
                </label>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline / Description
                </label>
                <textarea
                  value={formData.tagline}
                  onChange={(e) => setFormData(f => ({ ...f, tagline: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow resize-none"
                  placeholder="A compelling description that sells the product..."
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Highlights (What You Get)
                  </label>
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
                  >
                    + Add Highlight
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.highlights.map((highlight, i) => (
                    <div key={i} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl">
                      <div className="text-emerald-500 mt-1">✅</div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={highlight.title}
                          onChange={(e) => updateHighlight(i, 'title', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                          placeholder="Highlight title"
                        />
                        <input
                          type="text"
                          value={highlight.description}
                          onChange={(e) => updateHighlight(i, 'description', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                          placeholder="Brief description"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHighlight(i)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Features List
                  </label>
                  <p className="text-sm text-gray-500">Bullet points shown on the product card</p>
                </div>
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
                >
                  + Add Feature
                </button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <span className="text-emerald-500">✓</span>
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(i, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g., 2TB Cloud Storage"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Products List View
  const columns = [
    {
      header: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img src={row.image} alt={row.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">📦</div>
          )}
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            {!row.active && <span className="text-xs text-red-500">(Inactive)</span>}
            {row.popular && <span className="text-xs text-orange-500 ml-1">🔥 Popular</span>}
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      render: (row) => (
        <span className="font-semibold">${row.price}<span className="text-gray-400 font-normal">/{row.period || 'one-time'}</span></span>
      )
    },
    {
      header: 'Orders',
      render: (row) => <span className="text-gray-600">{row._count?.orders || 0}</span>
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          row.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {row.active ? '● Active' : '○ Inactive'}
        </span>
      )
    },
    {
      header: '',
      render: (row) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); openEditProduct(row) }}
            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            🗑️
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
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Product
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          onRowClick={openEditProduct}
          emptyMessage="No products yet. Add your first product!"
        />
      )}
    </div>
  )
}
