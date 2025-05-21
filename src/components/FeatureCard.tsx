
import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Icons;
  highlightColor?: string;
}

const FeatureCard = ({ title, description, icon, highlightColor = "from-tennis-green to-tennis-darkGreen" }: FeatureCardProps) => {
  // Create the icon component dynamically from the icon name
  const IconComponent = Icons[icon] as LucideIcon;

  return (
    <div className="p-8 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-all relative overflow-hidden group">
      {/* Tennis ball pattern background */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none court-pattern"></div>
      
      {/* Top highlight bar */}
      <div className={`h-1.5 w-20 bg-gradient-to-r ${highlightColor} rounded-full mb-6`}></div>
      
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
        <IconComponent className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default FeatureCard;
