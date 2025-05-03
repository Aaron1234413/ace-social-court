
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const SearchForm = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
      <Input
        type="search"
        placeholder="Search..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="pr-10 rounded-full bg-gray-100 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 w-[200px] lg:w-[300px]"
      />
      <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1">
        <Search className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default SearchForm;
