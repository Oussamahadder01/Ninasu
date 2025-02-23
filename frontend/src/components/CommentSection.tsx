import React, { useState, useEffect } from 'react';
import { VoteButtons } from './VoteButtons';
import { Button } from './ui/button';
import { MessageSquare, X, Edit2, Trash2, AtSign, ChevronDown } from 'lucide-react';
import { Comment, User, VoteValue } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { VoteButtonsComment } from './VoteButtonsComment';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onVoteComment: (commentId: string, type: VoteValue) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export function CommentSection({
  comments,
  onAddComment,
  onVoteComment,
  onEditComment,
  onDeleteComment,
}: CommentSectionProps) {
  const { isAuthenticated, user } = useAuth();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [showReplyButtons, setShowReplyButtons] = useState(false); // Separate state for reply buttons

  // Sorting state
  const [sortOption, setSortOption] = useState<'mostUpvoted' | 'recent' | 'oldest'>(() => {
    // Load the saved sorting option from localStorage, default to 'mostUpvoted'
    const savedSortOption = localStorage.getItem('sortOption');
    return savedSortOption ? savedSortOption as 'mostUpvoted' | 'recent' | 'oldest' : 'mostUpvoted';
  });

  // Sort comments based on the selected option
  const sortedComments = React.useMemo(() => {
    const copy = [...comments];
    switch (sortOption) {
      case 'mostUpvoted':
        return copy.sort((a, b) => (b.vote_count) - (a.vote_count));
      case 'recent':
        return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return copy;
    }
  }, [comments, sortOption]);

  // Handle sorting option change
  const handleSortChange = (option: 'mostUpvoted' | 'recent' | 'oldest') => {
    setSortOption(option);
    // Save the selected sorting option to localStorage
    localStorage.setItem('sortOption', option);
  };


  const handleStartReply = (commentId: string, authorUsername: string) => {
    setReplyingTo(commentId);
    setReplyContent(`@${authorUsername} `);
    setShowReplyButtons(true); // Show buttons for reply editor
  };

  const handleMention = (username: string, textareaRef: HTMLTextAreaElement) => {
    const currentContent = textareaRef.value;
    const cursorPos = textareaRef.selectionStart;
    const textBeforeCursor = currentContent.substring(0, cursorPos);
    const textAfterCursor = currentContent.substring(cursorPos);

    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    if (lastAtPos >= 0) {
      const newContent = textBeforeCursor.substring(0, lastAtPos) + `@${username} ` + textAfterCursor;

      if (replyingTo !== null) {
        setReplyContent(newContent);
      } else if (editingComment !== null) {
        setEditContent(newContent);
      } else {
        setNewComment(newContent);
      }
    }

    setShowMentions(false);
    textareaRef.focus();
  };

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    setter: (value: string) => void
  ) => {
    const { value, selectionStart } = e.target;
    setter(value);

    const textBeforeCursor = value.substring(0, selectionStart);
    const matches = textBeforeCursor.match(/@(\w*)$/);

    if (matches) {
      const rect = e.target.getBoundingClientRect();
      const position = getCaretCoordinates(e.target, selectionStart);

      setCursorPosition({
        top: rect.top + position.top - e.target.scrollTop,
        left: rect.left + position.left - e.target.scrollLeft,
      });

      setMentionFilter(matches[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  useEffect(() => {
    const extractUsers = (comments: Comment[]): User[] => {
      const userMap = new Map<string, User>();

      const addUser = (user: User) => {
        if (!userMap.has(user.id)) {
          userMap.set(user.id, user);
        }
      };

      const processComments = (comments: Comment[]) => {
        comments.forEach((comment) => {
          addUser(comment.author);
          if (comment.replies) {
            processComments(comment.replies);
          }
        });
      };

      processComments(comments);
      return Array.from(userMap.values());
    };

    setUsers(extractUsers(comments));
  }, [comments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(newComment);
      setNewComment('');
      setShowButtons(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(replyContent, parentId);
      setReplyContent('');
      setReplyingTo(null);
      setShowReplyButtons(false); // Hide buttons for reply editor
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      await onEditComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
      setShowButtons(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setShowButtons(true);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
    setShowButtons(false);
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        setSubmitting(true);
        await onDeleteComment(commentId);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const renderMentionsList = () => {
    if (!showMentions || !cursorPosition) return null;

    const filteredUsers = users.filter((u) =>
      u.username.toLowerCase().includes(mentionFilter.toLowerCase())
    );

    return (
      <div
        className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto"
        style={{
          position: 'fixed',
          top: cursorPosition.top + window.scrollY + 20,
          left: cursorPosition.left + window.scrollX,
        }}
      >
        {filteredUsers.map((user) => (
          <button
            key={user.id}
            type="button"
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            onMouseDown={(e) => {
              e.preventDefault();
              const textarea = document.querySelector('textarea:focus');
              if (textarea) {
                handleMention(user.username, textarea as HTMLTextAreaElement);
              }
            }}
          >
            <AtSign className="w-4 h-4 text-gray-500" />
            {user.username}
          </button>
        ))}
      </div>
    );
  };

  const renderCommentContent = (comment: Comment) => (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a
            href={`/user/${comment.author.username}/`}
            className="font-bold text-sm text-gray-900 hover:underline"
          >
            {comment.author.username}
          </a>
          <span className="text-sm text-gray-500">•</span>
          <time className="text-sm text-gray-500" dateTime={comment.created_at}>
            {formatTimeSince(comment.created_at)}
          </time>
        </div>
      </div>

      {editingComment === comment.id ? (
        <div className="mt-4">
          <textarea
            value={editContent}
            onChange={(e) => handleTextareaChange(e, setEditContent)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Edit your comment..."
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="sm"
              onClick={handleCancelEdit}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleEditSubmit(comment.id)}
              disabled={submitting || !editContent.trim()}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-gray-800">{comment.content}</div>
      )}

      <div className="mt-4 flex gap-2">
        {isAuthenticated && (
          <VoteButtonsComment
            initialVotes={(comment.vote_count)}
            onVote={(type) => onVoteComment(comment.id, type)}
            vertical={false}
            userVote={comment.user_vote}
          />
        )}

        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStartReply(comment.id, comment.author.username)}
            className="text-gray-600 hover:text-blue-600"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Reply
          </Button>
        )}

        {user?.id === comment.author.id && editingComment !== comment.id && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStartEdit(comment)}
              className="text-gray-600 hover:text-blue-600"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(comment.id)}
              className="text-gray-600 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderReplyForm = (parentId: string, parentAuthor: string) => (
    <div className="mt-4 relative">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600">
          Replying to {parentAuthor}
        </span>
        <button
          onClick={() => {
            setReplyingTo(null);
            setShowReplyButtons(false); // Hide buttons when canceling reply
          }}
          className="text-gray-400 hover:text-gray-600"
          title="Cancel reply"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        value={replyContent}
        onChange={(e) => handleTextareaChange(e, setReplyContent)}
        placeholder="Write your reply..."
        className="w-full p-1 border rounded-3xl  focus:ring-blue-900 focus:border-transparent"
        rows={3}
      />
      {/* Buttons inside the reply editor */}
      {showReplyButtons && (
        <div className="absolute bottom-2 right-2 flex gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-3xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              setReplyingTo(null);
              setShowReplyButtons(false); // Hide buttons when canceling reply
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmitReply(parentId)}
            disabled={submitting || !replyContent.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-3xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      )}
    </div>
  );

  const renderComment = (comment: Comment, depth = 0) => {
    const maxDepth = 3;
    const currentDepth = Math.min(depth, maxDepth);
    const marginLeft = currentDepth * 24;

    return (
      <div key={comment.id} className="relative" style={{ marginLeft: `${marginLeft}px` }}>
        {depth > 0 && (
          <div
            className="absolute top-0 left-[-12px] bottom-0 w-[1px] bg-gray-300"
            style={{ height: '100%' }}
          ></div>
        )}

        <div className="flex gap-4">
          <div className="flex-1">
            {renderCommentContent(comment)}
            {replyingTo === comment.id && renderReplyForm(comment.id, comment.author.username)}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatTimeSince = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const timeDiff = now.getTime() - commentDate.getTime();

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <div className="relative max-w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Comments</h2>

      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => handleTextareaChange(e, setNewComment)}
              placeholder="Write a comment..."
              className="comment-textarea"
              onFocus={() => setShowButtons(true)}
            />

            {/* Buttons inside the base comment editor */}
            {showButtons && (
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-3xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => {
                    e.preventDefault();
                    setNewComment('');
                    setShowButtons(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-3xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Posting...
                    </span>
                  ) : (
                    'Comment'
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-4 p-1 bg-gray-50 rounded-3xl border border-gray-200 text-center text-gray-700">
          Please{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            log in
          </a>{' '}
          to comment.
        </div>
      )}

      {/* Sorting Dropdown */}
      <div className="gap-2 mb-4 flex justify-start">
        <div className="relative">
          <label htmlFor="sort-comments" className="sr-only">Sort comments</label>
          <span className="mr-2">Sort by :</span>   
          <select
            id="sort-comments"
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value as 'mostUpvoted' | 'recent' | 'oldest')}
            className="gap-2 appearance-none bg-white border border-gray-200 rounded-2xl px-4 py-2 pr-8 text-sm text-gray-700  hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            
            <option value="mostUpvoted">Most Upvoted</option>
            <option value="recent">Recent</option>
            <option value="oldest">Oldest</option>
          </select>
          <div className="gap-2 pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 rounded-3xl">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {sortedComments
          .filter((comment) => !comment.parent_id)
          .map((comment) => renderComment(comment))}

        {comments.length === 0 && (
          <div className="text-center text-gray-600 py-8">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      {/* Mentions List */}
      {renderMentionsList()}
    </div>
  );
}

function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const div = document.createElement('div');
  const style = div.style;
  const computed = window.getComputedStyle(element);

  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  const properties = [
    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
    'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
    'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing',
  ];

  properties.forEach((prop) => {
    // @ts-ignore
    style[prop] = computed[prop];
  });

  div.textContent = element.value.substring(0, position);
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  document.body.appendChild(div);

  const coordinates = {
    top: span.offsetTop,
    left: span.offsetLeft
  };
  document.body.removeChild(div);
  
  return coordinates;
}