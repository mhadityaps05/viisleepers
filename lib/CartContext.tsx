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
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

type AddToCartItem = Omit<CartItem, "quantity">

type CartContextValue = {
  cartItems: CartItem[]
  addToCart: (item: AddToCartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

type CartAction =
  | { type: "hydrate"; payload: CartItem[] }
  | { type: "add"; payload: AddToCartItem }
  | { type: "remove"; payload: { id: string } }
  | { type: "updateQuantity"; payload: { id: string; quantity: number } }
  | { type: "clear" }

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "hydrate":
      return action.payload
    case "add": {
      const existing = state.find(
        (cartItem) => cartItem.id === action.payload.id,
      )
      if (existing) {
        return state.map((cartItem) =>
          cartItem.id === action.payload.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        )
      }

      return [...state, { ...action.payload, quantity: 1 }]
    }
    case "remove":
      return state.filter((cartItem) => cartItem.id !== action.payload.id)
    case "updateQuantity":
      if (action.payload.quantity < 1) {
        return state.filter((cartItem) => cartItem.id !== action.payload.id)
      }

      return state.map((cartItem) =>
        cartItem.id === action.payload.id
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[]
        if (Array.isArray(parsed)) {
          dispatch({ type: "hydrate", payload: parsed })
        }
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

  const removeFromCart = (id: string) => {
    dispatch({ type: "remove", payload: { id } })
  }

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "updateQuantity", payload: { id, quantity } })
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
