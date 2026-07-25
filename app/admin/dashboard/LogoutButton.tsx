"use client"

import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const response = await fetch("/api/admin/logout", {
      method: "POST",
    })

    if (response.ok) {
      router.push("/admin")
    } else {
      alert("Logout gagal")
    }
  }

  return (
    <div className="bg-white w-30 h-10 flex text-center justify-center rounded-2xl">
      <button type="button" onClick={handleLogout} className="text-black">
        Logout
      </button>
    </div>
  )
}
