
interface SkillProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

export const SkillProgressBar = ({ label, value, maxValue, color }: SkillProgressBarProps) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">{label}</span>
        <span className="text-sm text-muted-foreground">{value}/{maxValue}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
