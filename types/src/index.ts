/**
 * Shared types between the API and web packages.
 * These represent the HTTP contract — what the API sends and the web receives.
 */

/** A single entity field as returned by GET /api/entities */
export type Field = {
    name: string;
    type: string;
};

/** An entity's metadata as returned by GET /api/entities */
export type EntityMeta = {
    name: string;
    fields: Field[];
};

/** A single record count entry as returned by GET /api/dashboard */
export type EntityCount = {
    name: string;
    count: number;
};
