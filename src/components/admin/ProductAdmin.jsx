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
  trackInventory: true,
  categoryId: "",
  brandId: "",
  imageUrls: "",
};

export default function ProductAdmin({ products, categories, onRefresh, onNotice }) {
  const [form, setForm] = useState(initialProductForm);

  useEffect(() => {
    if (!form.categoryId && categories[0]?.id) {
      setForm((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  async function submit(event) {
    event.preventDefault();

    try {
      await api.createProduct({
        ...form,
        basePrice: Number(form.basePrice),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        brandId: form.brandId || null,
        imageUrls: form.imageUrls
          ? form.imageUrls.split(",").map((url) => url.trim())
          : [],
      });
      onNotice("Product created.");
      setForm(initialProductForm);
      onRefresh();
    } catch (error) {
      onNotice(`Product save failed: ${error.message}`);
    }
  }

  return (
    <div className="admin-grid">
      <form className="editor" onSubmit={submit}>
        <h2>Add Product</h2>
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
        <input
          placeholder="Image URLs comma separated"
          value={form.imageUrls}
          onChange={(event) => setForm({ ...form, imageUrls: event.target.value })}
        />
        <button className="primary full" type="submit">
          Create Product
        </button>
      </form>
      <DataTable
        columns={["Name", "Category", "Price", "Stock"]}
        rows={products.map((product) => [
          product.name,
          product.categoryName,
          currency(product.price),
          product.variants?.[0]?.availableStock ?? "-",
        ])}
        empty="No products."
      />
    </div>
  );
}
