import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiFetch } from '../services/api'

// -------------------- THUNKS --------------------

export const loadTags = createAsyncThunk(
    'tags/load',
    async () => {
        const res = await apiFetch('/tags')
        return res.data
    }
)


export const addTag = createAsyncThunk(
  'tags/add',
  async ({ name, type }) => {
    const res = await apiFetch('/tags', {
      method: 'POST',
      body: {
        name,
        type
      }
    })
    return res.data
  }
)


export const deleteTag = createAsyncThunk(
    'tags/delete',
    async (id, { dispatch }) => {
        await apiFetch(`/tags/${id}`, { method: 'DELETE' })
        dispatch(loadTags()) // 🔁 refresh tags from DB
        return id
    }
)


// -------------------- SLICE --------------------

const tagsSlice = createSlice({
    name: 'tags',
    initialState: {
        items: [],
        loading: false,
        success: null,
        error: null,
    },
    reducers: {
        clearTagStatus: (state) => {
            state.success = null
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadTags.pending, s => { s.loading = true })
            .addCase(loadTags.fulfilled, (s, a) => {
                s.items = a.payload
                s.loading = false
            })

            .addCase(deleteTag.fulfilled, (state) => {
                state.success = 'Tag deleted successfully'
            })
            .addCase(loadTags.rejected, (s, a) => {
                s.loading = false
                s.error = a.error.message || 'Failed to load tags'
            })
            .addCase(addTag.fulfilled, (s, a) => {
                s.items.push(a.payload)
                s.success = 'Tag created successfully'
            })
            .addCase(addTag.rejected, (s, a) => {
                s.error = a.error.message || 'Failed to create tag'
            })

    }
})

export const { clearTagStatus } = tagsSlice.actions
export default tagsSlice.reducer
