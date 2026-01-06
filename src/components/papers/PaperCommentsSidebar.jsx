import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Divider,
  Stack,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';

import { useDispatch, useSelector } from 'react-redux';
import {
  loadAuthoredPaperComments,
  addAuthoredPaperComment,
} from '../../store/authoredPaperCommentsSlice';

/* ---------- HELPERS ---------- */

const buildCommentTree = (comments) => {
  const map = {};
  comments.forEach(c => (map[c.id] = { ...c, replies: [] }));

  const roots = [];
  comments.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  // ✅ latest comments first
  roots.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return roots;
};

export default function PaperCommentsSidebar({ paperId }) {
  const dispatch = useDispatch();
  const { byId, order, loading, error } = useSelector(
    (s) => s.authoredPaperComments
  );
  const user = useSelector((s) => s.auth.user);

  /* ---------- STATE ---------- */
  const [activeReplyTo, setActiveReplyTo] = useState(null);
  const [replyValue, setReplyValue] = useState('');
  const [newCommentValue, setNewCommentValue] = useState('');

  const replyToolbarRef = useRef(null);
  const newToolbarRef = useRef(null);

  useEffect(() => {
    if (!paperId) return;
    dispatch(loadAuthoredPaperComments(paperId));
  }, [paperId, dispatch]);

  const canComment =
    user?.role === 'supervisor' ||
    user?.role === 'admin' ||
    user?.role === 'researcher';

  const editorConfig = {
    toolbar: {
      items: [
        'bold',
        'italic',
        'underline',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'undo',
        'redo',
      ],
    },
    placeholder: 'Write your comment…',
  };

  const comments = order.map(id => byId[id]).filter(Boolean);
  const tree = buildCommentTree(comments);

  /* ---------- RENDER THREAD ---------- */
  const renderThread = (comment, depth = 0) => (
    <Box
      key={comment.id}
      sx={{
        ml: depth * 2,
        p: 1.5,
        bgcolor: depth === 0 ? '#fff' : '#f5f7fb',
        borderRadius: 1.5,
        border: '1px solid #e0e0e0',
      }}
    >
      <Typography variant="caption" fontWeight={600}>
        {comment.user?.name} · {comment.user?.role}
      </Typography>

      <Box
        sx={{ mt: 1, fontSize: 14 }}
        dangerouslySetInnerHTML={{ __html: comment.body }}
      />

      {canComment && (
        <Typography
          sx={{
            mt: 1,
            fontSize: 13,
            color: 'primary.main',
            cursor: 'pointer',
            width: 'fit-content',
          }}
          onClick={() =>
            setActiveReplyTo(
              activeReplyTo === comment.id ? null : comment.id
            )
          }
        >
          Reply
        </Typography>
      )}

      {/* ---------- REPLY EDITOR ---------- */}
      {activeReplyTo === comment.id && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            bgcolor: '#fafafa',
            borderRadius: 1,
            border: '1px solid #d0d0d0',
          }}
        >
          <Box ref={replyToolbarRef} sx={{ mb: 1 }} />

          <CKEditor
            editor={DecoupledEditor}
            config={editorConfig}
            data={replyValue}
            onReady={(editor) => {
              if (replyToolbarRef.current) {
                replyToolbarRef.current.innerHTML = '';
                replyToolbarRef.current.appendChild(
                  editor.ui.view.toolbar.element
                );
              }
            }}
            onChange={(_, ed) => setReplyValue(ed.getData())}
          />

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="contained"
              disabled={!replyValue.trim()}
              onClick={() => {
                dispatch(
                  addAuthoredPaperComment({
                    paperId,
                    body: replyValue,
                    parent_id: comment.id,
                  })
                );
                setReplyValue('');
                setActiveReplyTo(null);
              }}
            >
              Reply
            </Button>

            <Button
              size="small"
              onClick={() => {
                setReplyValue('');
                setActiveReplyTo(null);
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      )}

      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {comment.replies.map(r => renderThread(r, depth + 1))}
      </Stack>
    </Box>
  );

  return (
    <Box
      sx={{
        width: 320,
        minWidth: 320,
        borderLeft: '1px solid #e0e0e0',
        bgcolor: '#f9f9fb',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ---------- HEADER ---------- */}
      <Box sx={{ p: 2 }}>
        <Typography fontWeight={600}>
          Supervisor Comments
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Review discussion for this draft
        </Typography>
      </Box>

      <Divider />

      {/* ---------- ADD NEW COMMENT (TOP) ---------- */}
      {canComment && (
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: '#fff',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Add a new comment
          </Typography>

          <Box
            sx={{
              mt: 1,
              mr: 1.5,
              p: 1.5,
              bgcolor: '#fafafa',
              borderRadius: 1,
              border: '1px solid #d0d0d0',

              '& .ck-editor__editable': {
                minHeight: 80,
                fontSize: 14,
              },
            }}
          >
            <Box ref={newToolbarRef} sx={{ mb: 1 }} />

            <CKEditor
              editor={DecoupledEditor}
              config={editorConfig}
              data={newCommentValue}
              onReady={(editor) => {
                if (newToolbarRef.current) {
                  newToolbarRef.current.innerHTML = '';
                  newToolbarRef.current.appendChild(
                    editor.ui.view.toolbar.element
                  );
                }
              }}
              onChange={(_, ed) =>
                setNewCommentValue(ed.getData())
              }
            />
          </Box>

          <Button
            variant="contained"
            sx={{ mt: 1 }}
            disabled={!newCommentValue.trim()}
            onClick={() => {
              dispatch(
                addAuthoredPaperComment({
                  paperId,
                  body: newCommentValue,
                })
              );
              setNewCommentValue('');
            }}
          >
            Add Comment
          </Button>
        </Box>
      )}

      {/* ---------- COMMENTS LIST ---------- */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {loading && <CircularProgress size={20} />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && tree.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', mt: 4 }}
          >
            No comments yet.
          </Typography>
        )}

        <Stack spacing={2}>
          {tree.map(c => renderThread(c))}
        </Stack>
      </Box>
    </Box>
  );
}
