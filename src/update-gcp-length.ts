/* eslint-disable no-console -- Console application. */

import { I18nEnvironments } from "@aidc-toolkit/core";
import { GCPLengthCache, i18nGS1Init, PrefixManager } from "@aidc-toolkit/gs1";
import * as fs from "node:fs";
import * as path from "node:path";

const DATA_DIRECTORY = "docs";

const BINARY_DATE_TIME_PATH = path.resolve(DATA_DIRECTORY, "gcp-length-date-time.txt");

const BINARY_DATA_PATH = path.resolve(DATA_DIRECTORY, "gcp-length.bin");

const JSON_DATA_PATH = path.resolve(DATA_DIRECTORY, "gcp-length.json");

const gcpLengthCache = new class extends GCPLengthCache {
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
        let dateTime: Date | undefined;

        try {
            dateTime = new Date(fs.readFileSync(BINARY_DATE_TIME_PATH).toString());
        } catch {
            dateTime = undefined;
        }

        this.#logDateTime("Cache", dateTime);

        return dateTime;
    }

    /**
     * @inheritDoc
     */
    get cacheData(): Uint8Array {
        return fs.readFileSync(BINARY_DATA_PATH);
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
    update(_nextCheckDateTime: Date, cacheDateTime?: Date, cacheData?: Uint8Array): void {
        if (cacheDateTime !== undefined) {
            fs.writeFileSync(BINARY_DATE_TIME_PATH, cacheDateTime.toISOString());
        }

        if (cacheData !== undefined) {
            fs.writeFileSync(BINARY_DATA_PATH, cacheData);
        }

        console.log(cacheDateTime !== undefined || cacheData !== undefined ? "Cache updated." : "Cache unchanged.");
    }
}();

i18nGS1Init(I18nEnvironments.CLI).then(async () => {
    await PrefixManager.loadGCPLengthData(gcpLengthCache);
}).catch((e: unknown) => {
    console.error(e);
});
