"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Login() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  async function login(e) {
    e.preventDefault()

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })

    if (res.ok) {
      router.push("/admin/dashboard")
    } else {
      alert("Username atau Password salah")
    }
  }

  return (
    <div className="font-benguiat bg-[#3C6D53] w-full h-min-screen ">
      <form onSubmit={login}>
        <div className="flex justify-center ">
          <div className="grid bg-[#3C6D53] w-120 h-120 p-10 items-center justify-center">
            <div className="text-white text-5xl">LOGIN</div>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-white border-b-2 bg-transparent text-white"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white border-b-2 bg-transparent text-white"
            />

            <button className="bg-white text-[#3C6D53] font-bold py-2 px-4 rounded">
              Login
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
