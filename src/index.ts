import fs from "fs";
import { WebApi, getPersonalAccessTokenHandler } from "azure-devops-node-api";
import { IReleaseApi } from "azure-devops-node-api/ReleaseApi";

const settings = JSON.parse(fs.readFileSync('src/settings.json', 'utf8'));

type Deployment = {
  id: number | undefined;
  completedOn: Date | undefined;
  stageDisplayName: string | undefined;
  status: number | undefined;
};

class ReleaseProvider {
  private readonly releaseApi: IReleaseApi;

  constructor(releaseApi: IReleaseApi) {
    this.releaseApi = releaseApi;
  }

  async listDeployments(project: string, definitionId: number): Promise<Deployment[]> {
    let continuationToken: number | undefined;
    const top = 5;
    let deployments: Deployment[] = []
    let hasMore = true;
    let requestCount = 0;

    while (hasMore) {
      const response = await this.releaseApi.getDeployments( 
        project,            // project
        definitionId,       // definitionId
        undefined,          // definitionEnvironmentId
        undefined,          // createdBy
        undefined,          // minModifiedTime
        undefined,          // maxModifiedTime
        undefined,          // deploymentStatus
        undefined,          // operationStatus
        undefined,          // latestAttemptsOnly
        undefined,          // queryOrder
        top,                // top
        continuationToken,  // continuationToken
        undefined,          // createdFor
        undefined,          // minStartedTime
        undefined,          // maxStartedTime
        undefined           // sourceBranch
      );
      requestCount++;

      if (response && response.length > 0) {
        if (requestCount > 1) {
          response.shift();
        }
        const mappedDeployments = response.map(deploymentData => ({
          id: deploymentData.id,
          completedOn: deploymentData.completedOn,
          stageDisplayName: deploymentData.releaseEnvironment?.name,
          status: deploymentData.operationStatus,
        }));
        deployments.push(...mappedDeployments);

        if (response.length === top) {
          const lastItem = response[response.length - 1];
          continuationToken = lastItem.id;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`requestCount: ${requestCount}`);
    return deployments;
  }
}

class AzureDevOpsApiFactory {
  async getApi(collectionUrl: string, accessToken: string) {
    return new WebApi(collectionUrl, getPersonalAccessTokenHandler(accessToken));
  }

  async getReleaseManager(collectionUrl: string, accessToken: string) {
    const webApi = await this.getApi(collectionUrl, accessToken);
    const releaseApi = await webApi.getReleaseApi();
    return new ReleaseProvider(releaseApi);
  }
}

(async () => {
  const factory: AzureDevOpsApiFactory = new AzureDevOpsApiFactory();
  const releaseManager: ReleaseProvider = await factory.getReleaseManager(settings.collectionUrl, settings.accessToken);

  const projectId: string = 'Webstaurantstore.com';
  const definitionId: number = 11;

  const deployments: Deployment[] = await releaseManager.listDeployments(projectId, definitionId);

  console.log(JSON.stringify(deployments, null, 2)); 

})();

