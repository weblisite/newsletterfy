"use client";
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function DigitalProducts({ digitalProducts = [], onClose }) {
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    type: 'course',
    price: '',
    description: '',
    features: [],
    fileUrl: '',
    previewUrl: '',
    status: 'draft'
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);

  // Calculate total sales and revenue
  const totalSales = digitalProducts.reduce((sum, product) => sum + product.sales, 0);
  const totalRevenue = digitalProducts.reduce((sum, product) => sum + product.revenue, 0);
  const platformFee = totalRevenue * 0.2; // 20% platform fee
  const creatorRevenue = totalRevenue * 0.8; // 80% creator revenue

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureAdd = () => {
    const feature = document.getElementById('featureInput').value.trim();
    if (feature) {
      setNewProduct(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
      document.getElementById('featureInput').value = '';
    }
  };

  const handleFeatureRemove = (index) => {
    setNewProduct(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB limit
    if (file.size > maxSize) {
      toast.error('File size must be less than 5GB');
      return;
    }

    try {
      type === 'main' ? setUploadingFile(true) : setUploadingPreview(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      setNewProduct(prev => ({
        ...prev,
        [type === 'main' ? 'fileUrl' : 'previewUrl']: url
      }));

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      type === 'main' ? setUploadingFile(false) : setUploadingPreview(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newProduct.fileUrl) {
      toast.error('Please upload the product file');
      return;
    }

    try {
      const response = await fetch('/api/monetization/digital-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (!response.ok) throw new Error('Failed to create product');

      toast.success('Digital product created successfully');
      setNewProduct({
        name: '',
        type: 'course',
        price: '',
        description: '',
        features: [],
        fileUrl: '',
        previewUrl: '',
        status: 'draft'
      });
      setShowNewProductForm(false);
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      const response = await fetch(`/api/monetization/digital-products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      toast.success('Product status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/monetization/digital-products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete product');
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Digital Products</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Sales Overview */}
      <div className="mb-8 bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Sales Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{digitalProducts.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-2xl font-bold text-cyan-600">{totalSales}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Your Revenue (80%)</p>
            <p className="text-2xl font-bold text-purple-600">${creatorRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Product Management */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-gray-900">Your Products</h4>
          <button
            onClick={() => setShowNewProductForm(!showNewProductForm)}
            className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
          >
            <i className="fas fa-plus mr-1"></i>
            Create New Product
          </button>
        </div>

        {/* New Product Form */}
        {showNewProductForm && (
          <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type
                </label>
                <select
                  name="type"
                  value={newProduct.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  required
                >
                  <option value="course">Course</option>
                  <option value="ebook">E-Book</option>
                  <option value="template">Template</option>
                  <option value="resource">Resource</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD)
              </label>
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={newProduct.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Features
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="featureInput"
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Add a feature"
                />
                <button
                  type="button"
                  onClick={handleFeatureAdd}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-2">
                {newProduct.features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between bg-white p-2 rounded">
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleFeatureRemove(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product File
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'main')}
                  className="w-full"
                  accept=".pdf,.zip,.mp4,.epub"
                />
                {uploadingFile && <p className="text-sm text-cyan-600 mt-1">Uploading...</p>}
                {newProduct.fileUrl && (
                  <p className="text-sm text-green-600 mt-1">File uploaded successfully</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview File (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'preview')}
                  className="w-full"
                  accept=".pdf,.mp4"
                />
                {uploadingPreview && <p className="text-sm text-cyan-600 mt-1">Uploading...</p>}
                {newProduct.previewUrl && (
                  <p className="text-sm text-green-600 mt-1">Preview uploaded successfully</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
              disabled={uploadingFile || uploadingPreview}
            >
              Create Product
            </button>
          </form>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {digitalProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start mb-2">
                <h5 className="text-lg font-medium text-gray-900">{product.name}</h5>
                <div className="flex items-center space-x-2">
                  <select
                    value={product.status}
                    onChange={(e) => handleStatusChange(product.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-gray-900">${product.price}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  product.status === 'published' 
                    ? 'bg-green-100 text-green-800'
                    : product.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.status}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Sales: {product.sales}</span>
                  <span>Revenue: ${product.revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Platform Information</h4>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Revenue Share</h5>
            <p className="text-sm text-gray-600">
              Earn 80% of all sales revenue. Newsletterfy takes a 20% platform fee to cover payment processing and hosting costs.
            </p>
            <div className="mt-2 flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
              <span className="text-sm font-medium text-gray-600">80%</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Supported File Types</h5>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                PDF documents (e-books, guides, worksheets)
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Video files (MP4 format for courses)
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                ZIP archives (templates, resource bundles)
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                EPUB files (e-books)
              </li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Best Practices</h5>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Provide clear product descriptions and features
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Include preview content when possible
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Set competitive prices based on value
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Regularly update and maintain your products
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 