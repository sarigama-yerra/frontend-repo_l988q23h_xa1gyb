import { useEffect, useMemo, useState } from 'react'

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        active
          ? 'bg-blue-600 text-white border-blue-600 shadow'
          : 'bg-white/70 backdrop-blur border-slate-300 text-slate-700 hover:bg-white'
      }`}
    >
      {label}
    </button>
  )
}

function MenuCard({ item, onAdd }) {
  return (
    <div className="group bg-white/80 backdrop-blur rounded-xl border border-slate-200 p-4 flex gap-4 hover:shadow-lg transition-shadow">
      <img
        src={item.image_url || `https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop`}
        alt={item.name}
        className="w-20 h-20 rounded-lg object-cover"
      />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-800 leading-tight">{item.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{item.category}</p>
          </div>
          <div className="text-right">
            <div className="text-blue-600 font-bold">₹{item.price.toFixed(2)}</div>
          </div>
        </div>
        {item.description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs font-medium ${item.is_available ? 'text-green-600' : 'text-red-500'}`}>
            {item.is_available ? 'Available 24x7' : 'Currently Unavailable'}
          </span>
          <button
            disabled={!item.is_available}
            onClick={() => onAdd(item)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

function CartItem({ item, onInc, onDec, onRemove }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-slate-800">{item.name}</p>
        <p className="text-xs text-slate-500">₹{item.price.toFixed(2)} × {item.qty}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onDec(item.id)} className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200">-</button>
        <span className="w-6 text-center text-sm">{item.qty}</span>
        <button onClick={() => onInc(item.id)} className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200">+</button>
        <button onClick={() => onRemove(item.id)} className="ml-2 text-red-600 text-sm">Remove</button>
      </div>
    </div>
  )
}

export default function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [loading, setLoading] = useState(true)
  const [menu, setMenu] = useState([])
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [placing, setPlacing] = useState(false)
  const [toast, setToast] = useState(null)

  // Coupon state
  const COUPON_CODE = 'RTU20'
  const [couponInput, setCouponInput] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(m => m.category)))
    return ['All', ...cats]
  }, [menu])

  const filteredMenu = useMemo(() => {
    return category === 'All' ? menu : menu.filter(m => m.category === category)
  }, [menu, category])

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const isEligibleForDiscount = subtotal >= 300
  const discount = couponApplied && isEligibleForDiscount ? subtotal * 0.2 : 0
  const deliveryFee = subtotal > 0 ? 10 : 0
  const total = Math.max(0, subtotal - discount + deliveryFee)

  useEffect(() => {
    fetchMenu()
  }, [])

  // If cart changes and subtotal drops below threshold, remove discount automatically
  useEffect(() => {
    if (couponApplied && !isEligibleForDiscount) {
      setCouponApplied(false)
      setToast({ type: 'error', msg: `Coupon removed (min ₹300 not met)` })
    }
  }, [isEligibleForDiscount, couponApplied])

  async function fetchMenu() {
    setLoading(true)
    try {
      const res = await fetch(`${baseUrl}/api/menu`)
      const data = await res.json()
      setMenu(data)
      if (data.length === 0) {
        // seed minimal menu for first-time experience
        await seedMenu()
        const seeded = await (await fetch(`${baseUrl}/api/menu`)).json()
        setMenu(seeded)
      }
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', msg: 'Unable to load menu. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function seedMenu() {
    const items = [
      // Beverages
      { name: 'Tea', category: 'Beverages', price: 10, description: 'Hot tea', is_available: true, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=600&auto=format&fit=crop' },
      { name: 'Coffee', category: 'Beverages', price: 10, description: 'Hot coffee', is_available: true, image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop' },
      { name: 'Banana Shake (1L)', category: 'Beverages', price: 90, description: 'Creamy banana shake, 1 litre', is_available: true, image_url: 'https://images.unsplash.com/photo-1586201375754-1421e0aa2bcc?q=80&w=600&auto=format&fit=crop' },
      { name: 'Masala Chai', category: 'Beverages', price: 15, description: 'Freshly brewed spiced tea', is_available: true, image_url: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?q=80&w=600&auto=format&fit=crop' },
      { name: 'Cold Coffee', category: 'Beverages', price: 60, description: 'Chilled coffee with ice', is_available: true, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=600&auto=format&fit=crop' },

      // Cold Drinks
      { name: 'Coca-Cola 250ml', category: 'Cold Drinks', price: 35, description: 'Chilled Coke 250ml', is_available: true, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop' },
      { name: 'Coca-Cola 500ml', category: 'Cold Drinks', price: 50, description: 'Chilled Coke 500ml', is_available: true, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop' },
      { name: 'Sprite 500ml', category: 'Cold Drinks', price: 50, description: 'Lemon-lime soda 500ml', is_available: true, image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=600&auto=format&fit=crop' },
      { name: 'Fanta 500ml', category: 'Cold Drinks', price: 50, description: 'Orange soda 500ml', is_available: true, image_url: 'https://images.unsplash.com/photo-1600289031468-904c0b8ee1f0?q=80&w=600&auto=format&fit=crop' },
      { name: 'Thums Up 500ml', category: 'Cold Drinks', price: 50, description: 'Strong cola 500ml', is_available: true, image_url: 'https://images.unsplash.com/photo-1624722213088-23c5321135a4?q=80&w=600&auto=format&fit=crop' },

      // Chips
      { name: 'Lays Classic Salted', category: 'Chips', price: 20, description: 'Classic salted potato chips', is_available: true, image_url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?q=80&w=600&auto=format&fit=crop' },
      { name: 'Lays Magic Masala', category: 'Chips', price: 20, description: 'Spicy masala chips', is_available: true, image_url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?q=80&w=600&auto=format&fit=crop' },
      { name: 'Kurkure Masala Munch', category: 'Chips', price: 20, description: 'Masaledar crunchy snack', is_available: true, image_url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?q=80&w=600&auto=format&fit=crop' },
      { name: 'Bingo Mad Angles', category: 'Chips', price: 20, description: 'Tangy triangle chips', is_available: true, image_url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?q=80&w=600&auto=format&fit=crop' },

      // Fast Food (keep a few)
      { name: 'Veg Maggie', category: 'Fast Food', price: 45, description: 'Masala maggie with veggies', is_available: true, image_url: 'https://images.unsplash.com/photo-1604908812464-07f2b02ab0ad?q=80&w=600&auto=format&fit=crop' },
      { name: 'Paneer Sandwich', category: 'Fast Food', price: 70, description: 'Grilled sandwich with paneer', is_available: true, image_url: 'https://images.unsplash.com/photo-1604908554007-43c8fb1a8c54?q=80&w=600&auto=format&fit=crop' },
      { name: 'French Fries', category: 'Fast Food', price: 65, description: 'Crispy golden fries', is_available: true, image_url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?q=80&w=600&auto=format&fit=crop' },
    ]
    for (const it of items) {
      await fetch(`${baseUrl}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(it)
      })
    }
  }

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }]
    })
    setToast({ type: 'success', msg: `${item.name} added to cart` })
  }

  function inc(id) { setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)) }
  function dec(id) { setCart(prev => prev.flatMap(i => i.id === id ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i])) }
  function removeItem(id) { setCart(prev => prev.filter(i => i.id !== id)) }

  function applyCoupon(e) {
    e?.preventDefault?.()
    const code = couponInput.trim().toUpperCase()
    if (code !== COUPON_CODE) {
      setCouponApplied(false)
      setToast({ type: 'error', msg: 'Invalid coupon code' })
      return
    }
    if (!isEligibleForDiscount) {
      setCouponApplied(false)
      setToast({ type: 'error', msg: 'Min order ₹300 required for this coupon' })
      return
    }
    setCouponApplied(true)
    setToast({ type: 'success', msg: 'Coupon applied! 20% off' })
  }

  async function placeOrder(e) {
    e.preventDefault()
    if (cart.length === 0) return
    const form = new FormData(e.currentTarget)
    const payload = {
      customer_name: form.get('name'),
      phone: form.get('phone'),
      hostel: form.get('hostel'),
      room: form.get('room'),
      delivery_instructions: form.get('notes') || '',
      items: cart.map(c => ({ item_id: c.id, name: c.name, qty: c.qty, price: c.price })),
      total_amount: Number(total.toFixed(2)),
    }
    try {
      setPlacing(true)
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Order failed')
      const data = await res.json()
      setToast({ type: 'success', msg: `Order placed! ID: ${data.id}` })
      setCart([])
      setCouponApplied(false)
      setCouponInput('')
      e.currentTarget.reset()
    } catch (err) {
      setToast({ type: 'error', msg: 'Could not place order. Try again.' })
    } finally {
      setPlacing(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      {/* Promo Bar */}
      <div className="sticky top-0 z-50">
        <div className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white text-sm">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="font-semibold tracking-wide">Special Offer</span>
            <span className="hidden sm:inline">•</span>
            <span>Use code</span>
            <span className="px-2 py-0.5 rounded bg-white/20 font-mono text-xs">RTU20</span>
            <span>to get</span>
            <span className="font-semibold">20% OFF</span>
            <span>on orders above ₹300</span>
          </div>
        </div>

        <header className="backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/flame-icon.svg" alt="logo" className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">RTU Kota Canteen</h1>
                <p className="text-xs text-slate-500 -mt-0.5">24x7 delivery to RTU hostels</p>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              Open • 24 Hours
            </div>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <Chip key={cat} label={cat} active={cat === category} onClick={() => setCategory(cat)} />
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">Loading menu...</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredMenu.map(item => (
                <MenuCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          )}
        </section>

        <aside className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-4 sticky top-28">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Your Cart</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500">No items yet. Add something tasty!</p>
            ) : (
              <div className="divide-y">
                {cart.map(c => (
                  <CartItem key={c.id} item={c} onInc={inc} onDec={dec} onRemove={removeItem} />)
                )}
              </div>
            )}

            {/* Coupon input */}
            <form onSubmit={applyCoupon} className="mt-3 flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                Apply
              </button>
            </form>
            {couponApplied && (
              <p className="mt-1 text-xs text-green-600">Coupon applied: 20% off on subtotal</p>
            )}
            {!isEligibleForDiscount && couponInput.trim().toUpperCase() === COUPON_CODE && (
              <p className="mt-1 text-xs text-amber-600">Add items worth ₹{(300 - subtotal).toFixed(0)} more to use this coupon</p>
            )}

            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700"><span>Coupon (RTU20)</span><span>-₹{discount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-600">Delivery</span><span className="font-medium">₹{deliveryFee.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>

            <form onSubmit={placeOrder} className="mt-4 space-y-3">
              <input name="name" required placeholder="Your Name" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="phone" required placeholder="Phone" pattern="[0-9]{10}" title="10 digit phone" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input name="hostel" required placeholder="Hostel Name" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input name="room" required placeholder="Room Number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              <textarea name="notes" placeholder="Delivery instructions (optional)" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />

              <button
                type="submit"
                disabled={cart.length === 0 || placing}
                className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {placing ? 'Placing order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </aside>
      </main>

      <footer className="py-8 text-center text-xs text-slate-500">
        Made for RTU students • Beverages and fast food delivered to your hostel
      </footer>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
