-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create saved_groups table
CREATE TABLE IF NOT EXISTS public.saved_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    participants TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create constraints table
CREATE TABLE IF NOT EXISTS public.constraints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.saved_groups(id) ON DELETE CASCADE NOT NULL,
    person_a VARCHAR(255) NOT NULL,
    person_b VARCHAR(255) NOT NULL,
    constraint_type VARCHAR(50) NOT NULL CHECK (constraint_type IN ('hard_together', 'hard_apart', 'soft_together', 'soft_apart')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grouping_sessions table
CREATE TABLE IF NOT EXISTS public.grouping_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.saved_groups(id) ON DELETE CASCADE NOT NULL,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    groups_data JSONB NOT NULL,
    participants_count INTEGER NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.saved_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grouping_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_groups
CREATE POLICY "Users can view their own saved groups" ON public.saved_groups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved groups" ON public.saved_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved groups" ON public.saved_groups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved groups" ON public.saved_groups
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for constraints
CREATE POLICY "Users can view constraints for their groups" ON public.constraints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.saved_groups 
            WHERE saved_groups.id = constraints.group_id 
            AND saved_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert constraints for their groups" ON public.constraints
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.saved_groups 
            WHERE saved_groups.id = constraints.group_id 
            AND saved_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update constraints for their groups" ON public.constraints
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.saved_groups 
            WHERE saved_groups.id = constraints.group_id 
            AND saved_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete constraints for their groups" ON public.constraints
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.saved_groups 
            WHERE saved_groups.id = constraints.group_id 
            AND saved_groups.user_id = auth.uid()
        )
    );

-- Create RLS policies for grouping_sessions
CREATE POLICY "Users can view sessions for their groups" ON public.grouping_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.saved_groups 
            WHERE saved_groups.id = grouping_sessions.group_id 
            AND saved_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sessions for their groups" ON public.grouping_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.saved_groups 
            WHERE saved_groups.id = grouping_sessions.group_id 
            AND saved_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sessions for their groups" ON public.grouping_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.saved_groups 
            WHERE saved_groups.id = grouping_sessions.group_id 
            AND saved_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sessions for their groups" ON public.grouping_sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.saved_groups 
            WHERE saved_groups.id = grouping_sessions.group_id 
            AND saved_groups.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_groups_user_id ON public.saved_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_groups_name ON public.saved_groups(name);
CREATE INDEX IF NOT EXISTS idx_constraints_group_id ON public.constraints(group_id);
CREATE INDEX IF NOT EXISTS idx_constraints_persons ON public.constraints(person_a, person_b);
CREATE INDEX IF NOT EXISTS idx_grouping_sessions_group_id ON public.grouping_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_grouping_sessions_date ON public.grouping_sessions(session_date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$$ language 'plpgsql';

-- Create trigger for saved_groups updated_at
CREATE TRIGGER update_saved_groups_updated_at 
    BEFORE UPDATE ON public.saved_groups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();