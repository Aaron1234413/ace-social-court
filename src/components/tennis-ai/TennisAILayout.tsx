
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ConversationSidebar from '@/components/tennis-ai/ConversationSidebar';
import ConnectionStatus from '@/components/tennis-ai/ConnectionStatus';

interface TennisAILayoutProps {
  title: string;
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
  onReconnect: () => void;
  onPreferencesOpen: () => void;
}

const TennisAILayout: React.FC<TennisAILayoutProps> = ({
  title,
  children,
  sidebarContent,
  onReconnect,
  onPreferencesOpen
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={onPreferencesOpen}
          >
            Preferences
          </Button>
          <ConnectionStatus 
            onReconnect={onReconnect} 
            className="ml-2" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mobile sidebar drawer */}
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden mb-4 flex items-center">
                <Menu className="mr-2 h-4 w-4" />
                Conversations
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] sm:w-[350px]">
              <div className="h-full py-4">
                {sidebarContent}
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Desktop sidebar - visible on larger screens */}
        <div className="hidden lg:block">
          {sidebarContent}
        </div>

        {/* Main content area - takes up most of the space */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
};

export default TennisAILayout;
