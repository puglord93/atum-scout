export const PIPELINE_STAGES = [
  { id: 'identified',  label: 'Identified',  short: 'ID',      color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'    },
  { id: 'reached_out', label: 'Reached Out', short: 'Out',     color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'    },
  { id: 'replied',     label: 'Replied',     short: 'Reply',   color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  { id: 'meeting',     label: 'Meeting',     short: 'Meet',    color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'   },
  { id: 'poc',         label: 'POC',         short: 'POC',     color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { id: 'partner',     label: 'Partner',     short: 'Partner', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'   },
] as const;

export type StageId = typeof PIPELINE_STAGES[number]['id'];

export function getStage(id: string) {
  return PIPELINE_STAGES.find(s => s.id === id) ?? PIPELINE_STAGES[0];
}

export function stageIndex(id: string) {
  return PIPELINE_STAGES.findIndex(s => s.id === id);
}
