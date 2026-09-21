/**
 * Widens literal unions back to their base types, recursively.
 *
 * TypeScript widens every string in a JSON import to `string`, so assigning
 * a dataset import straight to `CvData` fails on unions such as `ContactType`
 * and `SectionId`. Using `as CvData` instead would disable type checking
 * entirely — verified: removing the required `company` field still built
 * cleanly.
 *
 * Shared by every typed dataset entry point, so all of them apply the same
 * build-time structure check: missing required fields and wrong value types
 * fail the build, while invalid union *values* (a misspelled `type: "emial"`)
 * slip through by design and are left to the runtime validator.
 */
export type Loosen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Loosen<U>[]
        : T extends object
          ? { [K in keyof T]: Loosen<T[K]> }
          : T;
