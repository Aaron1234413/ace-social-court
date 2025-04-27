
import { useState } from 'react';
import { Check, X } from 'lucide-react';
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

export const TagSelector = ({ selectedTags, onTagsChange, availableTags }: TagSelectorProps) => {
  const [open, setOpen] = useState(false);

  const removeTag = (tagToRemove: Tag) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
  };

  const addTag = (tagToAdd: Tag) => {
    if (!selectedTags.find(tag => tag.id === tagToAdd.id)) {
      onTagsChange([...selectedTags, tagToAdd]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
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
            Add tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {availableTags.map(tag => {
                const isSelected = selectedTags.some(
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
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
