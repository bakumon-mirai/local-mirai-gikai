import "server-only";
import type { PressConferenceListItem } from "../../shared/types";
import { findPublishedPressConferenceList } from "../repositories/press-conference-repository";

export async function getPressConferences(): Promise<
  PressConferenceListItem[]
> {
  return findPublishedPressConferenceList();
}
