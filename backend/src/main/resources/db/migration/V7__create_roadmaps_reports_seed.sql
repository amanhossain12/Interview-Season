-- V7: Roadmaps and Reports

CREATE TABLE roadmaps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES interview_sessions(id),
    title           VARCHAR(255),
    weekly_plan     JSONB NOT NULL,                 -- [{week, topics, resources, tasks}]
    weak_topics     TEXT[],
    target_role     VARCHAR(255),
    total_weeks     INTEGER DEFAULT 4,
    current_week    INTEGER DEFAULT 1,
    progress_pct    INTEGER DEFAULT 0,              -- 0–100
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);

CREATE TABLE roadmap_progress (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id  UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    topic       VARCHAR(255) NOT NULL,
    completed   BOOLEAN DEFAULT FALSE,
    notes       TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_progress_roadmap_id ON roadmap_progress(roadmap_id);

CREATE TABLE reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id          UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score       DECIMAL(5,2),
    technical_score     DECIMAL(5,2),
    communication_score DECIMAL(5,2),
    confidence_score    DECIMAL(5,2),
    summary             TEXT,
    strengths           TEXT[],
    weaknesses          TEXT[],
    recommendations     TEXT[],
    topic_breakdown     JSONB,
    pdf_url             VARCHAR(1000),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_session_id ON reports(session_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);

CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed some coding challenges
INSERT INTO coding_challenges (title, description, difficulty, category, tags, constraints, examples, test_cases, starter_code, time_limit_ms, memory_limit_mb, is_active)
VALUES
(
    'Two Sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    'EASY',
    'Arrays',
    ARRAY['array', 'hash-map'],
    '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9',
    '[{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] == 9, return [0, 1]."}, {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"}]',
    '[{"input": "2 7 11 15\n9", "expected_output": "0 1", "is_hidden": false}, {"input": "3 2 4\n6", "expected_output": "1 2", "is_hidden": false}, {"input": "3 3\n6", "expected_output": "0 1", "is_hidden": true}]',
    '{"java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}", "python": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass", "javascript": "var twoSum = function(nums, target) {\n    // Write your solution here\n};"}',
    2000, 256, TRUE
),
(
    'Valid Parentheses',
    'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order.',
    'EASY',
    'Stack',
    ARRAY['stack', 'string'],
    '1 <= s.length <= 10^4, s consists of parentheses only ''()[]{}'',',
    '[{"input": "s = \"()\"", "output": "true"}, {"input": "s = \"()[]{}", "output": "true"}, {"input": "s = \"(]\"", "output": "false"}]',
    '[{"input": "()", "expected_output": "true", "is_hidden": false}, {"input": "()[]{}", "expected_output": "true", "is_hidden": false}, {"input": "(]", "expected_output": "false", "is_hidden": false}]',
    '{"java": "class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}", "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass", "javascript": "var isValid = function(s) {\n};"}',
    2000, 256, TRUE
),
(
    'Reverse Linked List',
    'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    'EASY',
    'Linked List',
    ARRAY['linked-list', 'recursion'],
    'The number of nodes in the list is the range [0, 5000]. -5000 <= Node.val <= 5000',
    '[{"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]"}, {"input": "head = [1,2]", "output": "[2,1]"}]',
    '[{"input": "1 2 3 4 5", "expected_output": "5 4 3 2 1", "is_hidden": false}, {"input": "1 2", "expected_output": "2 1", "is_hidden": false}]',
    '{"java": "class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        return null;\n    }\n}", "python": "class Solution:\n    def reverseList(self, head):\n        pass", "javascript": "var reverseList = function(head) {\n};"}',
    2000, 256, TRUE
),
(
    'Binary Search',
    'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
    'EASY',
    'Binary Search',
    ARRAY['binary-search', 'array'],
    '1 <= nums.length <= 10^4, -10^4 < nums[i], target < 10^4. All integers in nums are unique. nums is sorted in ascending order.',
    '[{"input": "nums = [-1,0,3,5,9,12], target = 9", "output": "4"}, {"input": "nums = [-1,0,3,5,9,12], target = 2", "output": "-1"}]',
    '[{"input": "-1 0 3 5 9 12\n9", "expected_output": "4", "is_hidden": false}, {"input": "-1 0 3 5 9 12\n2", "expected_output": "-1", "is_hidden": false}]',
    '{"java": "class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}", "python": "class Solution:\n    def search(self, nums, target):\n        pass", "javascript": "var search = function(nums, target) {\n};"}',
    2000, 256, TRUE
),
(
    'Merge Intervals',
    'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    'MEDIUM',
    'Arrays',
    ARRAY['array', 'sorting'],
    '1 <= intervals.length <= 10^4, intervals[i].length == 2, 0 <= starti <= endi <= 10^4',
    '[{"input": "intervals = [[1,3],[2,6],[8,10],[15,18]]", "output": "[[1,6],[8,10],[15,18]]"}, {"input": "intervals = [[1,4],[4,5]]", "output": "[[1,5]]"}]',
    '[{"input": "1 3\n2 6\n8 10\n15 18", "expected_output": "1 6\n8 10\n15 18", "is_hidden": false}]',
    '{"java": "class Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[][]{};\n    }\n}", "python": "class Solution:\n    def merge(self, intervals):\n        pass", "javascript": "var merge = function(intervals) {\n};"}',
    2000, 256, TRUE
);
