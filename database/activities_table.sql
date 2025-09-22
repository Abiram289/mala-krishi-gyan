-- Create activities table for farming activity tracking
-- Run this in Supabase SQL Editor

CREATE TABLE activities (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('planting', 'watering', 'fertilizing', 'harvesting')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'completed')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_status ON activities(status);

-- Enable Row Level Security (RLS)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own activities
CREATE POLICY "Users can view own activities" 
  ON activities FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy: Users can only insert their own activities
CREATE POLICY "Users can insert own activities" 
  ON activities FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can only update their own activities
CREATE POLICY "Users can update own activities" 
  ON activities FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy: Users can only delete their own activities
CREATE POLICY "Users can delete own activities" 
  ON activities FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_activities_updated_at 
  BEFORE UPDATE ON activities 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample activities (optional - for testing)
-- You can remove this section if you don't want sample data
INSERT INTO activities (user_id, title, type, status, date, notes) VALUES
  (
    (SELECT id FROM auth.users LIMIT 1), -- This will use the first user for testing
    'Plant rice seedlings',
    'planting',
    'completed',
    '2024-09-12',
    'Planted in north field'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Water coconut trees',
    'watering',
    'pending',
    CURRENT_DATE,
    'Check irrigation system'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Apply organic fertilizer',
    'fertilizing',
    'scheduled',
    CURRENT_DATE + INTERVAL '1 day',
    'Use compost from home preparation'
  );

-- Grant necessary permissions (if needed)
GRANT ALL ON activities TO authenticated;
GRANT USAGE ON SEQUENCE activities_id_seq TO authenticated;