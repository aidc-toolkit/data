import { getLogger, i18nCoreCLILanguageDetector, LocalAppDataStorage } from "@aidc-toolkit/core";
import { LogLevels } from "@aidc-toolkit/core/src/index.js";
import {
    GCPLength,
    GCPLengthCache,
    type GCPLengthData,
    type GCPLengthSourceJSON,
    i18nGS1Init,
    isGCPLengthSourceJSON
} from "@aidc-toolkit/gs1";
import i18next from "i18next";

const DATA_DIRECTORY = "docs";

const JSON_DATA_KEY = "gcp-length";

const logger = getLogger(LogLevels.Info);

/**
 * Update GCP length cache.
 */
class UpdateGCPLengthCache extends GCPLengthCache {
    /**
     * Source data.
     */
    #sourceData?: Promise<GCPLengthSourceJSON>;

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
        logger.info(`${type} date/time is ${dateTime?.toISOString()}.`);
    }

    /**
     * @inheritDoc
     */
    override get cacheDateTime(): Promise<Date | undefined> {
        return super.cacheDateTime.then((cacheDateTime) => {
            this.#logDateTime("Cache", cacheDateTime);

            return cacheDateTime;
        });
    }

    /**
     * @inheritDoc
     */
    override get sourceDateTime(): Promise<Date> {
        return this.sourceData.then((sourceData) => {
            const dateTime = new Date(sourceData.GCPPrefixFormatList.date);

            this.#logDateTime("Source", dateTime);

            return dateTime;
        });
    }

    /**
     * @inheritDoc
     */
    override get sourceData(): Promise<GCPLengthSourceJSON> {
        if (this.#sourceData === undefined) {
            this.#sourceData = this.appDataStorage.read(JSON_DATA_KEY).then((appData) => {
                if (!isGCPLengthSourceJSON(appData)) {
                    throw new Error("Invalid GCP length source JSON");
                }

                return appData;
            });
        }

        return this.#sourceData;
    }

    /**
     * @inheritDoc
     */
    override async update(nextCheckDateTime: Date, cacheDateTime?: Date, cacheData?: GCPLengthData): Promise<void> {
        logger.info(cacheData !== undefined ? "Cache updated." : "Cache unchanged.");

        return super.update(nextCheckDateTime, cacheDateTime, cacheData).then(async () =>
            this.appDataStorage.delete(GCPLengthCache.NEXT_CHECK_DATE_TIME_STORAGE_KEY)
        );
    }
}

i18nGS1Init(i18next.use(i18nCoreCLILanguageDetector)).then(async () =>
    LocalAppDataStorage.get(DATA_DIRECTORY)
).then(async localAppDataStorage =>
    new GCPLength(new UpdateGCPLengthCache(localAppDataStorage)).load()
).catch((e: unknown) => {
    logger.error("Update GCP length failed", e);
    process.exit(1);
});
