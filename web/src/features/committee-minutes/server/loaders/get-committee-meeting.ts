import "server-only";
import type { CommitteeMeetingDetail } from "../../shared/types";
import { findMeetingById } from "../repositories/committee-meeting-repository";

/** 会議ID（UUID）で会議詳細（発言つき）を取得する */
export async function getCommitteeMeeting(
  meetingId: string
): Promise<CommitteeMeetingDetail | null> {
  return findMeetingById(meetingId);
}
