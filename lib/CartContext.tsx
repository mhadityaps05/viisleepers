"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react"

const CART_STORAGE_KEY = "viisleepers-cart"

export type CartItem = {
  productId: string
  name: string
  price: number
  image: string
  size: string
  quantity: number
}

type AddToCartItem = Omit<CartItem, "quantity">

type CartContextValue = {
  cartItems: CartItem[]
  addToCart: (item: AddToCartItem) => void
  removeFromCart: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

type CartAction =
  | { type: "hydrate"; payload: CartItem[] }
  | { type: "add"; payload: AddToCartItem }
  | { type: "remove"; payload: { productId: string; size: string } }
  | {
      type: "updateQuantity"
      payload: { productId: string; size: string; quantity: number }
    }
  | { type: "clear" }

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "hydrate":
      return action.payload
    case "add": {
      const existing = state.find(
        (cartItem) =>
          cartItem.productId === action.payload.productId &&
          cartItem.size === action.payload.size,
      )
      if (existing) {
        return state.map((cartItem) =>
          cartItem.productId === action.payload.productId &&
          cartItem.size === action.payload.size
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        )
      }

      return [...state, { ...action.payload, quantity: 1 }]
    }
    case "remove":
      return state.filter(
        (cartItem) =>
          !(
            cartItem.productId === action.payload.productId &&
            cartItem.size === action.payload.size
          ),
      )
    case "updateQuantity":
      if (action.payload.quantity < 1) {
        return state.filter(
          (cartItem) =>
            !(
              cartItem.productId === action.payload.productId &&
              cartItem.size === action.payload.size
            ),
        )
      }

      return state.map((cartItem) =>
        cartItem.productId === action.payload.productId &&
        cartItem.size === action.payload.size
          ? { ...cartItem, quantity: action.payload.quantity }
          : cartItem,
      )
    case "clear":
      return []
    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, dispatch] = useReducer(cartReducer, [])
  const hasHydrated = useRef(false)

  const sanitizeStoredCartItems = (payload: unknown): CartItem[] => {
    if (!Array.isArray(payload)) {
      return []
    }

    return payload.filter((item): item is CartItem => {
      if (!item || typeof item !== "object") {
        return false
      }

      const candidate = item as Partial<CartItem>

      return (
        typeof candidate.productId === "string" &&
        candidate.productId.trim().length > 0 &&
        typeof candidate.name === "string" &&
        typeof candidate.price === "number" &&
        Number.isFinite(candidate.price) &&
        typeof candidate.image === "string" &&
        typeof candidate.size === "string" &&
        candidate.size.trim().length > 0 &&
        typeof candidate.quantity === "number" &&
        Number.isFinite(candidate.quantity) &&
        candidate.quantity > 0
      )
    })
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const hydratedCart = sanitizeStoredCartItems(parsed)
        dispatch({ type: "hydrate", payload: hydratedCart })
      }
    } catch {
      // Ignore invalid localStorage values.
    } finally {
      hasHydrated.current = true
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated.current) {
      return
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (item: AddToCartItem) => {
    dispatch({ type: "add", payload: item })
  }

  const removeFromCart = (productId: string, size: string) => {
    dispatch({ type: "remove", payload: { productId, size } })
  }

  const updateQuantity = (
    productId: string,
    size: string,
    quantity: number,
  ) => {
    dispatch({ type: "updateQuantity", payload: { productId, size, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: "clear" })
  }

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  )

  const cartTotal = useMemo(
    () =>
      cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems],
  )

  const value: CartContextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }

  return context
}
