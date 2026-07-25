import ProductForm from "../ProductForm"

export default function NewProductPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Create Product</h1>
      </div>

      <ProductForm mode="create" />
    </section>
  )
}
