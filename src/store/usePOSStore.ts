import { create } from 'zustand'
import type { Product, ProductAddon, Session } from '@/types/database'

export interface CartItem {
  product: Product
  qty: number
  unitPrice: number
  addons: ProductAddon[]
}

interface POSStore {
  cart: CartItem[]
  linkedSession: Session | null
  addToCart: (product: Product, qty?: number) => void
  removeFromCart: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  setLinkedSession: (session: Session | null) => void
  cartTotal: () => number
}

export const usePOSStore = create<POSStore>((set, get) => ({
  cart: [],
  linkedSession: null,
  addToCart: (product, qty = 1) =>
    set(state => {
      const existing = state.cart.find(i => i.product.id === product.id)
      if (existing) {
        return {
          cart: state.cart.map(i =>
            i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
          ),
        }
      }
      return {
        cart: [
          ...state.cart,
          { product, qty, unitPrice: product.sale_price, addons: [] },
        ],
      }
    }),
  removeFromCart: productId =>
    set(state => ({ cart: state.cart.filter(i => i.product.id !== productId) })),
  updateQty: (productId, qty) =>
    set(state => ({
      cart: qty <= 0
        ? state.cart.filter(i => i.product.id !== productId)
        : state.cart.map(i => (i.product.id === productId ? { ...i, qty } : i)),
    })),
  clearCart: () => set({ cart: [], linkedSession: null }),
  setLinkedSession: session => set({ linkedSession: session }),
  cartTotal: () => {
    const { cart } = get()
    return cart.reduce((sum, item) => {
      const addonsTotal = item.addons.reduce((a, b) => a + b.additional_price, 0)
      return sum + (item.unitPrice + addonsTotal) * item.qty
    }, 0)
  },
}))
