import { useState } from "react";
import { api } from "../../api";
import DataTable from "../DataTable";

const initialCategoryForm = {
  name: "",
  description: "",
  imageUrl: "",
  parentCategoryId: "",
};

export default function CategoryAdmin({ categories, onRefresh, onNotice }) {
  const [form, setForm] = useState(initialCategoryForm);

  async function submit(event) {
    event.preventDefault();

    try {
      await api.createCategory({
        ...form,
        parentCategoryId: form.parentCategoryId || null,
      });
      onNotice("Category created.");
      setForm(initialCategoryForm);
      onRefresh();
    } catch (error) {
      onNotice(`Category save failed: ${error.message}`);
    }
  }

  return (
    <div className="admin-grid">
      <form className="editor" onSubmit={submit}>
        <h2>Add Category</h2>
        <input
          placeholder="Category name"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <input
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
        />
        <button className="primary full" type="submit">
          Create Category
        </button>
      </form>
      <DataTable
        columns={["Name", "Slug", "Active"]}
        rows={categories.map((category) => [
          category.name,
          category.slug,
          category.isActive ? "Yes" : "No",
        ])}
        empty="No categories."
      />
    </div>
  );
}
