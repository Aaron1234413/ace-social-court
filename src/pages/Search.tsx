
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search as SearchIcon, Users, MapPin } from 'lucide-react';
import UserSearchResults from '@/components/search/UserSearchResults';
import { useSearch } from '@/hooks/useSearch';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [activeTab, setActiveTab] = useState('users');
  const { results: userResults, isLoading } = useSearch(query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  return (
    <>
      <Helmet>
        <title>Search - rallypointx</title>
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search for players, coaches, or locations..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </div>
        </form>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="courts" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Courts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            {query ? (
              <>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
                  </div>
                ) : userResults.length > 0 ? (
                  <UserSearchResults users={userResults} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users found matching "{query}"</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Enter a search term to find people</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="courts">
            {query ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Court search functionality coming soon
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Enter a search term to find tennis courts</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Search;
