
import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { useDeletePost } from '@/hooks/use-posts';
import { Post } from '@/types/post';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EditPostModal } from '@/components/social/EditPostModal';

interface PostActionsProps {
  post: Post;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PostActions = ({ post, onEdit, onDelete }: PostActionsProps) => {
  const { user } = useAuth();
  const { deletePost, isDeleting } = useDeletePost();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // SECURITY FIX: Only show actions if user is logged in AND owns the post
  // This prevents users from editing ambassador posts or other users' posts
  if (!user || user.id !== post.user_id) {
    return null;
  }

  // Additional security check for ambassador content
  const isAmbassadorContent = post.author?.user_type === 'ambassador' || post.is_ambassador_content;
  if (isAmbassadorContent && user.id !== post.user_id) {
    return null;
  }

  const handleDelete = async () => {
    const success = await deletePost(post.id);
    if (success && onDelete) {
      onDelete();
    }
    setShowDeleteDialog(false);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    if (onEdit) {
      onEdit();
    }
  };
  
  // Stop event propagation to prevent interference with other post interactions
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={handleMenuClick}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open post menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={handleMenuClick} className="bg-white border shadow-lg z-50">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setShowEditModal(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer text-destructive focus:text-destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Post Modal */}
      <EditPostModal
        post={post}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onPostEdited={handleEditSuccess}
      />
    </>
  );
};
