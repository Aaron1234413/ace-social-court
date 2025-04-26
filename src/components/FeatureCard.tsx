
import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Icons;
}

const FeatureCard = ({ title, description, icon }: FeatureCardProps) => {
  // Create the icon component dynamically from the icon name
  const IconComponent = Icons[icon] as LucideIcon;

  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <IconComponent className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default FeatureCard;
