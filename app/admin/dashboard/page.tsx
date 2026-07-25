export default function AdminPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-black">Products</h3>
          <p className="text-3xl font-bold mt-2 text-black">0</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-black">Orders</h3>
          <p className="text-3xl font-bold mt-2 text-black">0</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-black">Customers</h3>
          <p className="text-3xl font-bold mt-2 text-black">0</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-black">Revenue</h3>
          <p className="text-3xl font-bold mt-2 text-black">Rp 0</p>
        </div>
      </div>
    </>
  )
}
