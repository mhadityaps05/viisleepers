import React from "react"

const products = [
  {
    id: 1,
    category: "Jacked",
    name: "BLACK JACKED",
    price: 350000,
    images: ["product1.png"],
  },

  {
    id: 3,
    category: "Pants",
    name: "Black Pants",
    price: 280000,
    images: ["pants1.png"],
  },
  {
    id: 4,
    category: "Jacked",
    name: "white jacked",
    price: 120000,
    images: ["product3.png"],
  },
]

// group products by category while preserving order
const groupedByCategory = products.reduce((acc, prod) => {
  if (!acc[prod.category]) acc[prod.category] = []
  acc[prod.category].push(prod)
  return acc
}, {})

export default function shop() {
  return (
    <div className="w-full  bg-black relative z-10 p-10 font-benguiat overflow-hidden">
      {Object.keys(groupedByCategory).map((category, catIndex) => {
        const items = groupedByCategory[category]
        return (
          <div
            key={category}
            id={category.toLowerCase()}
            className={catIndex > 0 ? "mt-10" : ""}
          >
            <h1 className="text-2xl">{category}</h1>

            <div className="w-full mt-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    id={`product-${item.id}`}
                    type="button"
                    aria-label={`View ${item.name}`}
                    className="flex flex-col items-start text-left cursor-pointer focus:outline-none"
                  >
                    <img src={item.images[0]} alt={`${item.name} image`} />
                    <div className="mt-5 ml-5">
                      <h2>{item.name}</h2>
                      <h3>{`Rp.${item.price.toLocaleString("id-ID")}`}</h3>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
