
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface LikeButtonProps {
  itemId: string;
  initialLikes: number;
}

const LikeButton = ({ itemId, initialLikes }: LikeButtonProps) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1);
      setIsLiked(false);
      toast.success("Like removed");
    } else {
      setLikes(prev => prev + 1);
      setIsLiked(true);
      toast.success("Post liked!");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className="flex items-center gap-1"
    >
      <Heart
        className={`h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`}
      />
      {likes}
    </Button>
  );
};

export default LikeButton;
