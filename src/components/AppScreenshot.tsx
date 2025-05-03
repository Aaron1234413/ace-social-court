
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface AppScreenshotProps {
  src: string;
  alt: string;
  title: string;
}

export const AppScreenshot = ({ src, alt, title }: AppScreenshotProps) => {
  return (
    <Card className="overflow-hidden border-2 border-muted shadow-lg mx-auto max-w-sm">
      <CardContent className="p-2">
        <div className="mb-2">
          <div className="flex items-center gap-1 px-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="ml-2 text-xs text-muted-foreground font-medium">{title}</div>
          </div>
        </div>
        <AspectRatio ratio={9/16} className="bg-muted rounded-sm overflow-hidden">
          <img 
            src={src} 
            alt={alt}
            className="object-cover w-full h-full rounded-sm"
          />
        </AspectRatio>
      </CardContent>
    </Card>
  );
};
