
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PostTemplate } from '@/types/post';
import { usePostTemplates } from '@/hooks/usePostTemplates';
import { Sparkles } from 'lucide-react';

interface PostTemplateSelectorProps {
  selectedTemplateId?: string;
  onTemplateSelect: (template: PostTemplate | null) => void;
  category?: string;
}

export function PostTemplateSelector({ 
  selectedTemplateId, 
  onTemplateSelect, 
  category 
}: PostTemplateSelectorProps) {
  const { data: templates, isLoading } = usePostTemplates();

  const filteredTemplates = category 
    ? templates?.filter(t => t.category === category) 
    : templates;

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onTemplateSelect(null);
    } else {
      const template = templates?.find(t => t.id === value);
      onTemplateSelect(template || null);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-1">
        <Sparkles className="h-4 w-4" />
        Post Template (Optional)
      </label>
      <Select value={selectedTemplateId || 'none'} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a template or write from scratch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">Write from scratch</span>
          </SelectItem>
          {filteredTemplates?.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{template.title}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {template.category}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedTemplate && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Template preview:</p>
          <p className="text-sm italic">{selectedTemplate.content_template}</p>
          {selectedTemplate.placeholders.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Fill in: {selectedTemplate.placeholders.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
