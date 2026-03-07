import { useEffect, useState } from 'react'
import AppShell from './apple/AppShell'

export default function Layout({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return <AppShell user={user}>{children}</AppShell>
}
