/* eslint-disable no-console -- Console application. */

import { I18nEnvironments } from "@aidc-toolkit/core";
import {
    GCPLengthCache,
    type GCPLengthData,
    type GCPLengthHeader,
    i18nGS1Init,
    PrefixManager,
    RemoteGCPLengthCache
} from "@aidc-toolkit/gs1";
import * as fs from "node:fs";
import * as path from "node:path";

const DATA_DIRECTORY = "docs";

const BINARY_HEADER_PATH = path.resolve(DATA_DIRECTORY, RemoteGCPLengthCache.SOURCE_HEADER_FILE_NAME);

const BINARY_DATA_PATH = path.resolve(DATA_DIRECTORY, RemoteGCPLengthCache.SOURCE_DATA_FILE_NAME);

const JSON_DATA_PATH = path.resolve(DATA_DIRECTORY, "gcp-length.json");

/**
 * Parse the GS1 Company Prefix length header.
 *
 * @param s
 * Multi-line string containing the header.
 *
 * @returns
 * GS1 Company Prefix length header.
 */
export function parseGCPLengthHeader(s: string): GCPLengthHeader {
    const lines = s.split("\n");

    return {
        dateTime: new Date(lines[0]),
        disclaimer: lines.slice(1).join("\n")
    };
}

const gcpLengthCache = new class extends GCPLengthCache {
    #gcpLengthData?: GCPLengthData;

    /**
     * Load GS1 Company Prefix length data if available.
     */
    #loadGCPLengthData(): void {
        try {
            const lines = fs.readFileSync(BINARY_HEADER_PATH).toString().split("\n");
            const data = fs.readFileSync(BINARY_DATA_PATH);

            this.#gcpLengthData = {
                dateTime: new Date(lines[0]),
                disclaimer: lines.slice(1).join("\n"),
                data
            };
        } catch {
            // Swallow error.
        }
    }

    /**
     * Log the date/time of the cache or source.
     *
     * @param type
     * Type (cache or source).
     *
     * @param dateTime
     * Date/time.
     */
    #logDateTime(type: string, dateTime: Date | undefined): void {
        console.log(`${type} date/time is ${dateTime?.toISOString()}.`);
    }

    /**
     * @inheritDoc
     */
    get nextCheckDateTime(): undefined {
        return undefined;
    }

    /**
     * @inheritDoc
     */
    get cacheDateTime(): Date | undefined {
        this.#loadGCPLengthData();

        const dateTime = this.#gcpLengthData?.dateTime;

        this.#logDateTime("Cache", dateTime);

        return dateTime;
    }

    /**
     * @inheritDoc
     */
    get cacheData(): GCPLengthData {
        this.#loadGCPLengthData();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Known to be defined.
        return this.#gcpLengthData!;
    }

    /**
     * @inheritDoc
     */
    get sourceDateTime(): Date {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- File format is known.
        const dateTime = new Date((JSON.parse(fs.readFileSync(JSON_DATA_PATH).toString()) as {
            GCPPrefixFormatList: {
                date: string;
            };
        }).GCPPrefixFormatList.date);

        this.#logDateTime("Source", dateTime);

        return dateTime;
    }

    /**
     * @inheritDoc
     */
    get sourceData(): string {
        return fs.readFileSync(JSON_DATA_PATH).toString();
    }

    /**
     * @inheritDoc
     */
    update(_nextCheckDateTime: Date, _cacheDateTime?: Date, cacheData?: GCPLengthData): void {
        if (cacheData !== undefined) {
            fs.writeFileSync(BINARY_HEADER_PATH, `${cacheData.dateTime.toISOString()}\n${cacheData.disclaimer}`);
            fs.writeFileSync(BINARY_DATA_PATH, cacheData.data);
        }

        console.log(cacheData !== undefined ? "Cache updated." : "Cache unchanged.");
    }
}();

i18nGS1Init(I18nEnvironments.CLI).then(async () => {
    await PrefixManager.loadGCPLengthData(gcpLengthCache);
}).catch((e: unknown) => {
    console.error(e);
});
