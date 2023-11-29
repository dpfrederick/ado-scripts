"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = require('fs');
const { WebApi, getPersonalAccessTokenHandler } = require("azure-devops-node-api");
const settings = JSON.parse(fs.readFileSync('src/settings.json', 'utf8'));
class ReleaseProvider {
    constructor(releaseApi, logger) {
        this.releaseApi = releaseApi;
        this.logger = logger;
    }
    listDeployments(project, definitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            let continuationToken = 0;
            const top = 5;
            const deployments = [];
            let hasMore = true;
            let requestCount = 0;
            let undefined;
            let response;
            while (hasMore) {
                try {
                    response = yield this.releaseApi.getDeployments({
                        project,
                        definitionId,
                        nullz: 0,
                        nullz: 0,
                        nullz: 0,
                        nullz: 0,
                        nullz: 0,
                        nullz: 0,
                        nullz: 0,
                        nullz: 0,
                        top,
                        continuationToken
                    });
                    requestCount++;
                    console.log(`response: ${JSON.stringify(response, null, 2)}`);
                }
                catch (err) {
                    console.log(`err: ${err}`);
                }
                if (response && response.length > 0) {
                    const mappedDeployments = response.map(deploymentData => ({
                        id: deploymentData.id,
                        completedOn: deploymentData.completedOn,
                        stageDisplayName: deploymentData.releaseEnvironment.name,
                        status: deploymentData.operationStatus,
                    }));
                    deployments.push(...mappedDeployments);
                    if (response.length === 5) {
                        continuationToken += 5;
                    }
                    else {
                        hasMore = false;
                    }
                }
                else {
                    hasMore = false;
                }
            }
            console.log(`requestCount: ${requestCount}`);
            return deployments;
        });
    }
}
class AzureDevOpsApiFactory {
    constructor(logger) {
        this.logger = logger;
    }
    getApi(collectionUrl, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return new WebApi(collectionUrl, getPersonalAccessTokenHandler(accessToken));
        });
    }
    getReleaseManager(collectionUrl, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // const releaseApi = await this.getApi(collectionUrl, accessToken).getReleaseApi();
            const webApi = yield this.getApi(collectionUrl, accessToken);
            const releaseApi = yield webApi.getReleaseApi();
            return new ReleaseProvider(releaseApi, this.logger);
        });
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const logger = {};
    const factory = new AzureDevOpsApiFactory(logger);
    const releaseManager = yield factory.getReleaseManager(settings.collectionUrl, settings.accessToken);
    const projectId = 'Webstaurantstore.com';
    const definitionId = 5;
    const deployments = yield releaseManager.listDeployments(projectId, definitionId);
    // const mappedDeployments = deployments.map((data) => ({
    //   id: data.id,
    //   completedOn: data.completedOn,
    //   stageDisplayName: data.stageDisplayName.name,
    //   status: data.status
    // }));
    console.log(JSON.stringify(deployments, null, 2));
}))();
