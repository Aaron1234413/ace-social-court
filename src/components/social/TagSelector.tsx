
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
          >
            <Tag className="mr-1 h-3 w-3" />
            Add tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          {/* Wrap Command component with error handling */}
          <div className="w-full">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandEmpty>No tags found.</CommandEmpty>
              {safeAvailableTags && safeAvailableTags.length > 0 ? (
                <CommandGroup>
                  {safeAvailableTags.map(tag => {
                    if (!tag || !tag.id) return null;
                    
                    const isSelected = safeSelectedTags.some(
                      selectedTag => selectedTag.id === tag.id
                    );
                    
                    return (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => {
                          if (isSelected) {
                            removeTag(tag);
                          } else {
                            addTag(tag);
                          }
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            isSelected ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {tag.name}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No tags available
                </div>
              )}
            </Command>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
