import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, Edit, Trash2, ShoppingBag, X, Save, Tag, DollarSign } from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import axios from "axios";
import toast from "react-hot-toast";

const Products = () => {
    const { user } = useAuth();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        userName: "",
        description: "",
        price: "",
        category: "General"
    });

    const API_URL = "http://localhost:5000/api/products";

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data.products || []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const payload = {
                ...formData,
                userName: user?.name || "Guest"
            };

            if (editingProduct) {
                const response = await axios.put(
                    `${API_URL}/${editingProduct._id}`,
                    payload,
                    config
                );

                setProducts(products.map(p =>
                    p._id === editingProduct._id ? response.data.product : p
                ));

                toast.success("Product updated successfully");
            } else {
                const response = await axios.post(API_URL, payload, config);
                setProducts([...products, response.data.product]);
                toast.success("Product created successfully");
            }

            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;

        try {
            const token = localStorage.getItem("token");

            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProducts(products.filter(p => p._id !== id));
            toast.success("Product deleted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Delete failed");
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name || "",
                userName: product.userName || "",
                description: product.description || "",
                price: product.price || "",
                category: product.category || "General"
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                userName: user?.name || "",
                description: "",
                price: "",
                category: "General"
            });
        }

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                    <ShoppingBag size={24} /> My Products
                </h3>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-all"
                >
                    <Plus size={18} /> Add Product
                </motion.button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-10 bg-gray-800 bg-opacity-30 rounded-xl border border-gray-700 border-dashed">
                    <Package className="mx-auto text-gray-600 mb-3" size={48} />
                    <p className="text-gray-400">No products found. Start by adding one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {products.map((product) => (
                            <motion.div
                                key={product._id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="p-4 bg-gray-800 bg-opacity-50 rounded-xl border border-gray-700 flex justify-between items-center"
                            >
                                <div className="space-y-1">
                                    <h2 className="font-bold text-white">{product.name}</h2>
                                    <p className="m-2 text-sm text-gray-400 mb-4">
                                by <b>{user?.name || "Guest"} </b> <i> ({user?.email || ""})</i>
                            </p>
                                    <p className="text-sm text-gray-400 line-clamp-1">{product.description}</p>
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-indigo-400 font-bold">${product.price}</span>
                                        <span className="text-gray-500">|</span>
                                        <span className="text-purple-400">{product.category}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(product)}
                                        className="p-2 text-indigo-400 hover:bg-indigo-900 hover:bg-opacity-30 rounded-lg"
                                    >
                                        <Edit size={18} />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(product._id)}
                                        className="p-2 text-rose-400 hover:bg-rose-900 hover:bg-opacity-30 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
                            onClick={closeModal}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold text-white">
                                    {editingProduct ? "Edit Product" : "Add New Product"}
                                </h3>
                                <button onClick={closeModal} className="text-gray-500 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-400 mb-4">
                                by <b>{user?.name || "Guest"} </b> <i> ({user?.email || ""})</i>
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter product name"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                                />

                                <textarea
                                    name="description"
                                    required
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Enter product description"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                                />

                                <input
                                    type="number"
                                    name="price"
                                    required
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                                />

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                                >
                                    <option value="General">General</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Clothing">Clothing</option>
                                    <option value="Home">Home</option>
                                    <option value="Services">Services</option>
                                    <option value="Books">Books</option>
                                    <option value="Toys">Toys</option>
                                    <option value="Other">Other</option>
                                </select>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 rounded-lg"
                                >
                                    {editingProduct ? "Update Product" : "Create Product"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Products;