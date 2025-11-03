/**
 * Predefined workflow templates for quick start.
 */

import { CreateStepRequest } from '@/lib/workflow-api';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  goal: string;
  icon: string;
  steps: Omit<CreateStepRequest, 'step_index'>[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'essay-writer',
    name: 'Essay Writer Pro',
    description: 'Multi-step essay writing with planning, drafting, verification, and humanization',
    goal: 'Generate a high-quality, human-like essay that meets specific requirements',
    icon: '📝',
    steps: [
      {
        step_type: 'PLAN',
        name: 'Create Outline',
        description: 'Generate a structured outline based on requirements',
        model: 'gpt-4o',
        techniques: ['plansearch'],
        parameters: {},
        requires_approval: false,
      },
      {
        step_type: 'DRAFT',
        name: 'Write Initial Draft',
        description: 'Generate the first draft of the essay',
        model: 'o1',
        techniques: ['moa'],
        parameters: {},
        requires_approval: true,
        approval_prompt: 'Review the draft before proceeding to verification',
      },
      {
        step_type: 'VERIFY',
        name: 'Verify Requirements',
        description: 'Check if the draft meets all requirements',
        model: 'claude-3-5-sonnet-20241022',
        techniques: ['cot_reflection'],
        parameters: {},
        requires_approval: false,
      },
      {
        step_type: 'HUMANIZE',
        name: 'Humanize Content',
        description: 'Make the text sound more natural and human-written',
        model: 'claude-3-5-sonnet-20241022',
        techniques: [],
        parameters: {},
        requires_approval: true,
        approval_prompt: 'Review the humanized version before final checks',
      },
      {
        step_type: 'INTEGRITY_CHECK',
        name: 'Fact Check',
        description: 'Verify factual accuracy and consistency',
        model: 'gpt-4o',
        techniques: ['cot_reflection'],
        parameters: {},
        requires_approval: false,
      },
      {
        step_type: 'AI_DETECTION',
        name: 'AI Detection Test',
        description: 'Estimate AI detection probability',
        model: 'gpt-4o',
        techniques: [],
        parameters: {},
        requires_approval: false,
      },
    ],
  },
  {
    id: 'code-review',
    name: 'Code Review Assistant',
    description: 'Multi-step code review with analysis, suggestions, and security checks',
    goal: 'Perform comprehensive code review with detailed feedback',
    icon: '🔍',
    steps: [
      {
        step_type: 'PLAN',
        name: 'Analysis Plan',
        description: 'Create a structured review plan',
        model: 'gpt-4o',
        techniques: ['plansearch'],
        parameters: {},
        requires_approval: false,
      },
      {
        step_type: 'CUSTOM',
        name: 'Code Analysis',
        description: 'Analyze code quality, patterns, and best practices',
        model: 'claude-3-5-sonnet-20241022',
        techniques: ['cot_reflection'],
        parameters: {},
        requires_approval: true,
        approval_prompt: 'Review the code analysis findings',
      },
      {
        step_type: 'CUSTOM',
        name: 'Security Review',
        description: 'Check for security vulnerabilities',
        model: 'gpt-4o',
        techniques: ['moa'],
        parameters: {},
        requires_approval: true,
        approval_prompt: 'Review security findings before generating report',
      },
      {
        step_type: 'DRAFT',
        name: 'Generate Report',
        description: 'Create a comprehensive review report',
        model: 'claude-3-5-sonnet-20241022',
        techniques: [],
        parameters: {},
        requires_approval: false,
      },
    ],
  },
  {
    id: 'research-paper',
    name: 'Research Paper Generator',
    description: 'Generate academic research paper with citations and formatting',
    goal: 'Create a well-researched academic paper with proper citations',
    icon: '🎓',
    steps: [
      {
        step_type: 'PLAN',
        name: 'Research Plan',
        description: 'Outline research methodology and structure',
        model: 'o1',
        techniques: ['plansearch'],
        parameters: {},
        requires_approval: true,
        approval_prompt: 'Review research plan before proceeding',
      },
      {
        step_type: 'CUSTOM',
        name: 'Literature Review',
        description: 'Gather and synthesize relevant research',
        model: 'claude-3-5-sonnet-20241022',
        techniques: ['moa'],
        parameters: {},
        requires_approval: false,
      },
      {
        step_type: 'DRAFT',
        name: 'Write Paper',
        description: 'Generate the research paper',
        model: 'o1',
        techniques: [],
        parameters: {},
        requires_approval: true,
        approval_prompt: 'Review the complete paper',
      },
      {
        step_type: 'VERIFY',
        name: 'Citation Check',
        description: 'Verify citations and formatting',
        model: 'gpt-4o',
        techniques: ['cot_reflection'],
        parameters: {},
        requires_approval: false,
      },
    ],
  },
];
