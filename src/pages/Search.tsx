
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search as SearchIcon, Users, MapPin, SlidersHorizontal, Filter } from 'lucide-react';
import UserSearchResults from '@/components/search/UserSearchResults';
import SearchFilters from '@/components/search/SearchFilters';
import { Card } from '@/components/ui/card';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [activeTab, setActiveTab] = useState('users');
  const [showFilters, setShowFilters] = useState(false);
  
  const { searchQuery, setSearchQuery, results: userResults, isLoading } = useSearch();
  
  // Update the search query when the URL parameter changes
  useEffect(() => {
    if (query) {
      setSearchQuery(query);
    }
  }, [query, setSearchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
      setSearchQuery(inputValue.trim());
    }
  };

  return (
    <>
      <Helmet>
        <title>Search - rallypointx</title>
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        {/* Hero Section with prominent search */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-tennis-green/5 rounded-xl -z-10"></div>
          <div className="relative z-10 py-10 px-4 sm:px-8 rounded-xl border border-tennis-green/20 shadow-sm bg-background/80 backdrop-blur-sm">
            <h1 className="text-3xl font-bold mb-3 text-center bg-gradient-to-r from-tennis-green to-tennis-darkGreen bg-clip-text text-transparent">
              Find Players & Coaches
            </h1>
            <p className="text-center text-muted-foreground mb-6">
              Connect with tennis enthusiasts in your area
            </p>
            
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-0 bg-tennis-green/10 rounded-lg blur-md -z-10 animate-pulse-subtle"></div>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="text" 
                      placeholder="Search for players, coaches, or locations..." 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="pl-10 py-6 h-auto border-tennis-green/30 focus-visible:ring-tennis-green/30"
                      autoComplete="off"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-tennis-green hover:bg-tennis-darkGreen"
                    size="lg"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Filter and tabs section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                People
              </TabsTrigger>
              <TabsTrigger value="courts" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Courts
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>
        
        {/* Filters panel */}
        {showFilters && (
          <Card className="mb-6 p-4 animate-fade-in">
            <SearchFilters />
          </Card>
        )}
        
        {/* Results content */}
        <div>
          <TabsContent value="users" className="mt-0">
            {query ? (
              <>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-tennis-green border-t-transparent"></div>
                    <p className="mt-4 text-muted-foreground">Searching for "{query}"</p>
                  </div>
                ) : userResults.length > 0 ? (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      Found {userResults.length} {userResults.length === 1 ? 'result' : 'results'} for "{query}"
                    </div>
                    <UserSearchResults users={userResults} />
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-block h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      <Users className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No users found</h3>
                    <p className="text-muted-foreground">
                      We couldn't find anyone matching "{query}". Try adjusting your search.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block h-20 w-20 rounded-full bg-tennis-green/10 flex items-center justify-center mb-4">
                  <SearchIcon className="h-10 w-10 text-tennis-green/60" />
                </div>
                <h3 className="text-lg font-medium mb-2">Let's find someone</h3>
                <p className="text-muted-foreground">
                  Enter a search term to find players and coaches
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="courts" className="mt-0">
            <div className="text-center py-12">
              <div className="inline-block h-20 w-20 rounded-full bg-tennis-green/10 flex items-center justify-center mb-4">
                <MapPin className="h-10 w-10 text-tennis-green/60" />
              </div>
              <h3 className="text-lg font-medium mb-2">Court search coming soon</h3>
              <p className="text-muted-foreground">
                We're working on making courts searchable. Please check back soon!
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab('users')}>
                Search for people instead
              </Button>
            </div>
          </TabsContent>
        </div>
      </div>
    </>
  );
};

export default Search;
