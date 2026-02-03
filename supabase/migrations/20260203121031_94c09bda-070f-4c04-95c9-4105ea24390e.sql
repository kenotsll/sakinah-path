-- Add DELETE policy for user_streaks table
-- This allows users to delete their own streak records if needed

CREATE POLICY "Users can delete their own streak"
ON public.user_streaks
FOR DELETE
USING (auth.uid() = user_id);