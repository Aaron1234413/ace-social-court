
import { useState } from 'react';
import { Check, X, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface Tag {
  id: string;
  name: string;
  category: string;
}

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  availableTags: Tag[];
}

export const TagSelector = ({ 
  selectedTags = [], 
  onTagsChange, 
  availableTags = [] 
}: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Ensure we have valid arrays for both selectedTags and availableTags
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];
  const safeAvailableTags = Array.isArray(availableTags) ? availableTags : [];
  
  const removeTag = (tagToRemove: Tag) => {
    if (safeSelectedTags.length === 0) return;
    onTagsChange(safeSelectedTags.filter(tag => tag.id !== tagToRemove.id));
  };

  const addTag = (tagToAdd: Tag) => {
    if (!safeSelectedTags.find(tag => tag.id === tagToAdd.id)) {
      onTagsChange([...safeSelectedTags, tagToAdd]);
    }
  };

  // Handle tag selection with a simple string value instead of using onSelect
  const handleTagSelect = (value: string) => {
    const selectedTag = safeAvailableTags.find(tag => tag.id === value);
    if (!selectedTag) return;
    
    const isSelected = safeSelectedTags.some(tag => tag.id === selectedTag.id);
    
    if (isSelected) {
      removeTag(selectedTag);
    } else {
      addTag(selectedTag);
    }
    
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {safeSelectedTags.map(tag => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag)}
              className="rounded-full hover:bg-muted p-0.5"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-dashed"
            type="button"
          >
            <Tag className="mr-1 h-3 w-3" />
            Add tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          {safeAvailableTags.length > 0 ? (
            <Command>
              <CommandInput 
                placeholder="Search tags..." 
                value={search}
                onValueChange={setSearch}
              />
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {safeAvailableTags
                  .filter(tag => tag && tag.id && tag.name)
                  .map(tag => (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={handleTagSelect}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          safeSelectedTags.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tags available
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
