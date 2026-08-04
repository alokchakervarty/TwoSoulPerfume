import { useEffect, useState } from "react";
import { api } from "../../api";
import { currency } from "../../utils/format";
import DataTable from "../DataTable";

const initialProductForm = {
  name: "",
  shortDescription: "",
  description: "",
  sku: "",
  basePrice: "",
  compareAtPrice: "",
  costPrice: "",
  initialStock: "",
  trackInventory: true,
  categoryId: "",
  brandId: "",
  imageUrls: "",
};

export default function ProductAdmin({ products, categories, onRefresh, onNotice }) {
  const [form, setForm] = useState(initialProductForm);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!form.categoryId && categories[0]?.id) {
      setForm((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  async function submit(event) {
    event.preventDefault();

    try {
      const payload = {
        ...form,
        basePrice: Number(form.basePrice),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        initialStock: form.initialStock ? Number(form.initialStock) : 0,
        brandId: form.brandId || null,
        imageUrls: form.imageUrls
          ? form.imageUrls.split(",").map((url) => url.trim()).filter(Boolean)
          : [],
      };

      if (isEditing && form.id) {
        await api.updateProduct(form.id, payload);
        onNotice("Product updated.");
      } else {
        await api.createProduct(payload);
        onNotice("Product created.");
      }

      resetForm();
      onRefresh();
    } catch (error) {
      onNotice(`Product save failed: ${error.message}`);
    }
  }

  function resetForm() {
    setForm(initialProductForm);
    setIsEditing(false);
    setSelectedImage(null);
    setImagePreview("");
  }

  function startEdit(product) {
    setIsEditing(true);
    setForm({
      ...initialProductForm,
      ...product,
      id: product.id,
      categoryId: product.categoryId || "",
      basePrice: product.price ?? "",
      compareAtPrice: product.mrp ?? "",
      initialStock: product.variants?.[0]?.availableStock ?? "",
      imageUrls: (product.imageUrls || [product.image]).filter(Boolean).join(", "),
    });
    setImagePreview(product.image || "");
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const response = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dataUrl: reader.result,
              fileName: file.name,
            }),
          });
          const result = await response.json();
          if (!response.ok || !result?.url) {
            throw new Error(result?.message || "Image upload failed.");
          }
          setSelectedImage(result.url);
          setImagePreview(result.url);
          setForm((current) => ({
            ...current,
            imageUrls: result.url,
          }));
          onNotice("Image uploaded.");
        } catch (error) {
          onNotice(`Image upload failed: ${error.message}`);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      onNotice(`Image upload failed: ${error.message}`);
    }
  }

  return (
    <div className="admin-grid">
      <form className="editor" onSubmit={submit}>
        <h2>{isEditing ? "Edit Product" : "Add Product"}</h2>
        <input
          placeholder="Product name"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          placeholder="SKU"
          required
          value={form.sku}
          onChange={(event) => setForm({ ...form, sku: event.target.value })}
        />
        <input
          placeholder="Short description"
          value={form.shortDescription}
          onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <div className="two-col">
          <input
            placeholder="Price"
            type="number"
            required
            value={form.basePrice}
            onChange={(event) => setForm({ ...form, basePrice: event.target.value })}
          />
          <input
            placeholder="MRP"
            type="number"
            value={form.compareAtPrice}
            onChange={(event) => setForm({ ...form, compareAtPrice: event.target.value })}
          />
        </div>
        <input
          placeholder="Inventory quantity"
          type="number"
          min="0"
          value={form.initialStock}
          onChange={(event) => setForm({ ...form, initialStock: event.target.value })}
        />
        <select
          value={form.categoryId}
          required
          onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Brand ID optional"
          value={form.brandId}
          onChange={(event) => setForm({ ...form, brandId: event.target.value })}
        />
        <label>
          <span>Upload product image</span>
          <input type="file" accept="image/*" onChange={uploadImage} />
        </label>
        {uploading && <div className="state small">Uploading image...</div>}
        {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", borderRadius: 8 }} />}
        <input
          placeholder="Image URL or uploaded path"
          value={form.imageUrls}
          onChange={(event) => setForm({ ...form, imageUrls: event.target.value })}
        />
        <div className="two-col">
          <button className="primary full" type="submit">
            {isEditing ? "Update Product" : "Create Product"}
          </button>
          <button className="secondary full" type="button" onClick={resetForm}>
            Reset
          </button>
        </div>
      </form>
      <DataTable
        columns={["Name", "Category", "Price", "Stock", "Action"]}
        rows={products.map((product) => [
          product.name,
          product.categoryName,
          currency(product.price),
          product.variants?.[0]?.availableStock ?? "-",
          <button key={product.id} type="button" onClick={() => startEdit(product)}>
            Edit
          </button>,
        ])}
        empty="No products."
      />
    </div>
  );
}
