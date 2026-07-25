import HomeClient from "./HomeClient"
import ShopSection from "./shop/ShopSection"
import { getGroupedProducts } from "@/lib/products"

export default async function Page() {
  const groupedProducts = await getGroupedProducts()

  return (
    <HomeClient>
      <ShopSection groupedProducts={groupedProducts} />
    </HomeClient>
  )
}
