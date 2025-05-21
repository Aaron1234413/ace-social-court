
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { QuoteIcon } from "lucide-react";

interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  author?: string; // For backward compatibility
  position?: string; // For backward compatibility
  avatarUrl?: string;
  accentColor?: string;
}

export const Testimonial = ({ 
  quote, 
  name, 
  title, 
  author, // Added for backward compatibility
  position, // Added for backward compatibility
  avatarUrl, 
  accentColor = "bg-primary/10 border-primary/20" 
}: TestimonialProps) => {
  // Use author as fallback for name for backward compatibility
  const displayName = name || author || '';
  // Use position as fallback for title for backward compatibility
  const displayTitle = title || position || '';
  
  // Create initials from name for avatar fallback
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <Card className={`h-full ${accentColor} hover:shadow-md transition-shadow border-2 relative overflow-hidden tennis-card`}>
      {/* Tennis court pattern background */}
      <div className="absolute inset-0 court-pattern opacity-5 pointer-events-none"></div>
      
      <CardContent className="pt-6 relative">
        <div className="mb-6">
          <QuoteIcon className="text-primary/70 w-8 h-8" />
        </div>
        <p className="text-lg font-medium leading-relaxed italic">"{quote}"</p>
      </CardContent>
      <CardFooter className="border-t pt-4 flex items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
          {avatarUrl && <img src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="bg-tennis-accent/10 text-tennis-accent font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground">{displayTitle}</p>
        </div>
      </CardFooter>
    </Card>
  );
};
