-- SCRIPT 8: CREATE CHAT MESSAGES TABLE
-- This table will store the chat history for each user.

CREATE TABLE chat_messages (
    message_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add an index for faster retrieval of messages for a user
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);

-- Grant permissions
GRANT ALL ON chat_messages TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE chat_messages_message_id_seq TO authenticated;
