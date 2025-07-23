-- Add estimated_completion_date column to development_assignments table
-- This migration adds a new column to store the target completion date for assignments

ALTER TABLE development_assignments 
ADD COLUMN estimated_completion_date DATE NULL 
AFTER estimated_hours;

-- Update the column comment for clarity
ALTER TABLE development_assignments 
MODIFY COLUMN estimated_completion_date DATE NULL 
COMMENT 'Target completion date for the assignment';

-- Create index for better query performance
CREATE INDEX idx_development_assignments_completion_date 
ON development_assignments(estimated_completion_date);

-- Update existing records with completion date if needed
-- This is optional - you can run this if you want to populate existing data
/*
UPDATE development_assignments 
SET estimated_completion_date = DATE_ADD(assignment_date, INTERVAL estimated_hours/8 DAY)
WHERE estimated_hours IS NOT NULL 
AND estimated_completion_date IS NULL;
*/ 