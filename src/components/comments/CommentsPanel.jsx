import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Paper, Stack, Avatar, Typography, IconButton, TextField, Button, Divider, CircularProgress, Tooltip } from '@mui/material';
import { Reply, Edit, Delete } from 'lucide-react';
import { loadComments, addComment, editComment, deleteComment } from '../../store/commentsSlice';

function buildTree(list) {
  const byParent = {};
  list.forEach((c) => { (byParent[c.parent_id ?? 0] ||= []).push(c); });
  const attach = (node) => ({ ...node, children: (byParent[node.id] || []).map(attach) });
  return (byParent[0] || []).map(attach);
}

function CommentItem({ node, paperId, meId }) {
  const dispatch = useDispatch();
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [editText, setEditText] = React.useState(node.body);

  const canEdit = meId && node.user?.id === meId;

  const submitReply = async () => {
    if (!text.trim()) return;
    await dispatch(addComment({ paperId, body: text.trim(), parent_id: node.id }));
    setText(''); setReplyOpen(false);
  };
  const submitEdit = async () => {
    if (!editText.trim()) return;
    await dispatch(editComment({ paperId, id: node.id, body: editText.trim() }));
    setEditOpen(false);
  };

  return (
    <Box sx={{ pl: node.parent_id ? 3 : 0, mt: 1.5 }}>
      <Stack direction="row" spacing={1.2} alignItems="flex-start">
        <Avatar sx={{ width: 28, height: 28 }}>{(node.user?.name || '?').charAt(0).toUpperCase()}</Avatar>
        <Box sx={{ flex: 1 }}>
          <Paper variant="outlined" sx={{ p: 1.25 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2">{node.user?.name || 'User'}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date(node.created_at).toLocaleString()}</Typography>
            </Stack>

            {!editOpen ? (
              <Typography variant="body2" sx={{ mt: .5, whiteSpace: 'pre-wrap' }}>{node.body}</Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: .5 }}>
                <TextField multiline minRows={2} value={editText} onChange={(e)=>setEditText(e.target.value)} />
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={submitEdit}>Save</Button>
                  <Button size="small" onClick={()=>{setEditOpen(false); setEditText(node.body);}}>Cancel</Button>
                </Stack>
              </Stack>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: .5 }}>
              <Tooltip title="Reply"><IconButton size="small" onClick={()=>setReplyOpen((v)=>!v)}><Reply size={18}/></IconButton></Tooltip>
              {canEdit && (
                <>
                  <Tooltip title="Edit"><IconButton size="small" onClick={()=>setEditOpen((v)=>!v)}><Edit size={18}/></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={()=>dispatch(deleteComment({ paperId, id: node.id }))}><Delete size={18}/></IconButton></Tooltip>
                </>
              )}
            </Stack>

            {replyOpen && (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <TextField multiline minRows={2} placeholder="Write a reply…" value={text} onChange={(e)=>setText(e.target.value)} />
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={submitReply}>Reply</Button>
                  <Button size="small" onClick={()=>{setReplyOpen(false); setText('');}}>Cancel</Button>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Box>
      </Stack>

      {/* children */}
      {node.children?.map((c) => (
        <CommentItem key={c.id} node={c} paperId={paperId} meId={meId} />
      ))}
    </Box>
  );
}

export default function CommentsPanel({ paperId }) {
  const dispatch = useDispatch();
  const { byId, order, loading } = useSelector((s) => s.comments || { byId: {}, order: [], loading: false });
  const meId = useSelector((s) => s.auth?.user?.id); // if you have auth slice; else keep undefined

  const [text, setText] = React.useState('');

  React.useEffect(() => { if (paperId) dispatch(loadComments(paperId)); }, [dispatch, paperId]);

  const list = order.map((id) => byId[id]).filter(Boolean);
  const tree = buildTree(list);

  const submitTop = async () => {
    if (!text.trim()) return;
    await dispatch(addComment({ paperId, body: text.trim() }));
    setText('');
  };

  return (
    <Paper sx={{ mt: 1.5, p: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Comments</Typography>
      <Divider sx={{ mb: 1 }} />
      <Stack spacing={1.5}>
        <Stack spacing={1}>
          <TextField
            placeholder="Add a public comment…"
            value={text}
            onChange={(e)=>setText(e.target.value)}
            multiline minRows={2}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={()=>setText('')}>Clear</Button>
            <Button variant="contained" onClick={submitTop}>Post</Button>
          </Box>
        </Stack>

        {loading ? (
          <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : tree.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
        ) : (
          tree.map((n) => <CommentItem key={n.id} node={n} paperId={paperId} meId={meId} />)
        )}
      </Stack>
    </Paper>
  );
}
