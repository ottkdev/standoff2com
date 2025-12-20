'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ForumSearchFiltersProps {
  searchParams: {
    search?: string
    category?: string
  }
  categories: Array<{ id: string; name: string; slug: string }>
}

export function ForumSearchFilters({ searchParams, categories }: ForumSearchFiltersProps) {
  const router = useRouter()
  const [search, setSearch] = useState(searchParams.search || '')
  const [category, setCategory] = useState(searchParams.category || 'all')

  useEffect(() => {
    setSearch(searchParams.search || '')
    setCategory(searchParams.category || 'all')
  }, [searchParams])

  const handleSearch = () => {
    const newParams = new URLSearchParams()
    if (search) newParams.set('search', search)
    if (category !== 'all') newParams.set('category', category)
    router.push(`/admin/forum?${newParams.toString()}`)
  }

  const handleReset = () => {
    setSearch('')
    setCategory('all')
    router.push('/admin/forum')
  }

  const hasFilters = search || category !== 'all'

  return (
    <Card className="glass-effect border-primary/20">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Konu başlığı veya içerik ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="w-full sm:w-[200px]">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all hover:border-primary/30">
                  <div className="flex items-center gap-2 flex-1">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Kategori" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  <SelectItem value="all" className="cursor-pointer hover:bg-primary/10 transition-colors">
                    Tüm Kategoriler
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Ara</span>
              </Button>
              {hasFilters && (
                <Button 
                  variant="outline" 
                  onClick={handleReset} 
                  className="gap-2 h-11 px-4 border-border/50 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Temizle</span>
                  <span className="sm:hidden">X</span>
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex items-center gap-2 pt-4 border-t border-border/50 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Aktif Filtreler:</span>
              </div>
              {search && (
                <Badge 
                  variant="secondary" 
                  className="gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <span>Arama: {search}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      handleSearch()
                    }}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {category !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <span>{categories.find((c) => c.id === category)?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('all')
                      handleSearch()
                    }}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ForumSearchFilters
export { ForumSearchFilters }

