
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CommentButtonProps {
  itemId: string;
  commentCount: number;
}

const CommentButton = ({ itemId, commentCount }: CommentButtonProps) => {
  const handleComment = () => {
    toast.info("Comments feature coming soon!");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleComment}
      className="flex items-center gap-1"
    >
      <MessageSquare className="h-4 w-4" />
      {commentCount}
    </Button>
  );
};

export default CommentButton;
