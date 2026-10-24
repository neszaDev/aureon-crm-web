import type { StageRef } from '@/libs/crm/Stages';

/**
 * What a new deal's form starts with from a list's link (`?stageId=`, `?ownerId=`): the open
 * stage it names, else the pipeline's first open one (a deal starts in an open stage); the member
 * it names only for a role that may give a deal to someone else, else the caller.
 * @param opts What the link and the workspace say.
 * @param opts.stages The pipeline's stages, in order.
 * @param opts.stageId The stage the link names, if any.
 * @param opts.ownerId The owner the link names, if any.
 * @param opts.members The workspace's members.
 * @param opts.mayAssign Whether the caller may give a deal to another member.
 * @param opts.me The caller's user id.
 * @returns The stage (none without an open stage) and the owner.
 */
export const dealPreset = (opts: {
  stages: StageRef[];
  stageId?: number;
  ownerId?: number;
  members: { userId: number }[];
  mayAssign: boolean;
  me: number;
}) => {
  const open = opts.stages.filter((stage) => stage.kind === 'OPEN');
  const stage = open.find((item) => item.id === opts.stageId) ?? open[0];
  const named = opts.members.some((member) => member.userId === opts.ownerId);

  return {
    stageId: stage?.id ?? null,
    ownerId: opts.mayAssign && named && opts.ownerId !== undefined ? opts.ownerId : opts.me,
  };
};
