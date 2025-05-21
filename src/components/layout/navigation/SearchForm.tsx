
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const SearchForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        state: { searchQuery: searchQuery.trim() }
      });
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
      <Input
        type="search"
        placeholder="Search..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="pr-10 rounded-full bg-muted/40 border-tennis-green/20 focus-visible:border-tennis-green/40 focus-visible:ring-tennis-green/10 w-[200px] lg:w-[300px] transition-all"
      />
      <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1 text-tennis-green opacity-80 hover:opacity-100 hover:bg-transparent">
        <Search className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default SearchForm;
