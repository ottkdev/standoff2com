'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, X, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserSearchFiltersProps {
  searchParams: {
    search?: string
    filter?: string
    role?: string
  }
}

export function UserSearchFilters({ searchParams }: UserSearchFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [search, setSearch] = useState(searchParams.search || '')
  const [filter, setFilter] = useState(searchParams.filter || 'all')
  const [role, setRole] = useState(searchParams.role || 'all')

  useEffect(() => {
    setSearch(searchParams.search || '')
    setFilter(searchParams.filter || 'all')
    setRole(searchParams.role || 'all')
  }, [searchParams])

  const handleSearch = () => {
    const newParams = new URLSearchParams()
    if (search) newParams.set('search', search)
    if (filter !== 'all') newParams.set('filter', filter)
    if (role !== 'all') newParams.set('role', role)
    router.push(`/admin/users?${newParams.toString()}`)
  }

  const handleReset = () => {
    setSearch('')
    setFilter('all')
    setRole('all')
    router.push('/admin/users')
  }

  const hasFilters = search || filter !== 'all' || role !== 'all'

  return (
    <Card className="glass-effect">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı adı veya e-posta ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="verified">Onaylı</SelectItem>
              <SelectItem value="unverified">Onaysız</SelectItem>
              <SelectItem value="banned">Yasaklı</SelectItem>
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Roller</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MODERATOR">Moderatör</SelectItem>
              <SelectItem value="USER">Kullanıcı</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              Ara
            </Button>
            {hasFilters && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <X className="h-4 w-4" />
                Temizle
              </Button>
            )}
          </div>
        </div>
        {hasFilters && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Aktif Filtreler:</span>
            {search && (
              <Badge variant="secondary" className="gap-1">
                Arama: {search}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setSearch('')
                    handleSearch()
                  }}
                />
              </Badge>
            )}
            {filter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {filter === 'verified' ? 'Onaylı' : filter === 'unverified' ? 'Onaysız' : 'Yasaklı'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setFilter('all')
                    handleSearch()
                  }}
                />
              </Badge>
            )}
            {role !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {role}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setRole('all')
                    handleSearch()
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UserSearchFilters
export { UserSearchFilters }

